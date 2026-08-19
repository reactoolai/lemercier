import { createClient } from "npm:@supabase/supabase-js@2";
import * as ftp from "npm:basic-ftp@5.0.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FTP_HOST = Deno.env.get("FTP_HOST") || "68.65.123.189";
const FTP_USER = Deno.env.get("FTP_USER") || "eric@reactool.ai";
const FTP_PASS = Deno.env.get("FTP_PASS") || "EricRetailpoint2026!!";

// Clean values: remove surrounding quotes and trim
function cleanVal(s: string): string {
  let v = s.trim();
  // Remove surrounding quotes
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v.trim();
}

// Parse Retailpoint XML format
// Structure: <products><product desc="..." numref="..."><skus><sku id="..." desc="..."><qt>0</qt><price>39.99</price>...</sku></skus><Images>...</Images></product></products>
function parseRetailpointXML(xml: string, startIdx: number): any[] {
  const products: any[] = [];
  
  // Match each <product> block
  const productRegex = /<product[^>]*>([\s\S]*?)<\/product>/gi;
  let pMatch;
  let idx = startIdx;

  while ((pMatch = productRegex.exec(xml)) !== null) {
    const productBlock = pMatch[0];
    
    // Extract product-level attributes
    const productDesc = (productBlock.match(/<product[^>]*desc="([^"]*)"/i) || [])[1] || "";
    const productNumref = (productBlock.match(/<product[^>]*numref="([^"]*)"/i) || [])[1] || "";
    
    // Extract Images
    const imageMatch = productBlock.match(/<IDimage>([^<]*)<\/IDimage>/i);
    let image = imageMatch ? cleanVal(imageMatch[1]) : "";
    // Build full image path
    if (image) {
      image = `https://lemerciersg.com/wp-content/uploads/2026/08/${image}`;
    }

    // Extract all <sku> blocks within this product
    const skuRegex = /<sku[^>]*>([\s\S]*?)<\/sku>/gi;
    let sMatch;
    
    while ((sMatch = skuRegex.exec(productBlock)) !== null) {
      const skuBlock = sMatch[0];
      
      // Get SKU attributes
      const skuId = (skuBlock.match(/<sku[^>]*id="([^"]*)"/i) || [])[1] || productNumref;
      const skuDesc = (skuBlock.match(/<sku[^>]*desc="([^"]*)"/i) || [])[1] || productDesc;
      
      // Get fields from within the sku block
      const getField = (tag: string): string => {
        const m = skuBlock.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
        return m ? cleanVal(m[1]) : "";
      };

      const qt = getField("qt");
      const price = parseFloat(getField("price").replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
      const dept = getField("Dept");
      const subDept = getField("SubDept");
      const fournisseur = getField("Fournisseur");
      const descFR = getField("DescFR");
      const descENG = getField("DescENG");
      const descWeb = getField("DescWeb");
      const season = getField("Season");
      const codebar = getField("codebar");
      
      // Use the best available description
      const name = descWeb || descFR || descENG || skuDesc || productDesc || skuId;
      const brand = fournisseur || "";
      const cat = subDept || dept || "";
      const stock = parseInt(qt) || 0;
      const id = skuId || productNumref || `item-${idx + 1}`;
      
      products.push({
        id, name, brand, cat, price,
        color: season || "",
        sizes: [],
        img: image,
        stock,
        sku: skuId || productNumref,
      });
      idx++;
    }
  }
  return products;
}

async function downloadFile(client: ftp.Client, remotePath: string): Promise<string> {
  const tmpPath = "/tmp/" + (remotePath.split("/").pop() || "download.xml");
  console.log(`Downloading ${remotePath} to ${tmpPath}...`);
  await client.downloadTo(tmpPath, remotePath);
  const content = await Deno.readTextFile(tmpPath);
  try { await Deno.remove(tmpPath); } catch {}
  return content;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const client = new ftp.Client(45000);
    client.ftp.verbose = true;
    client.ftp.encoding = "utf8";

    console.log("Connecting to FTPS:", FTP_HOST, ":21 (explicit TLS)");

    let connected = false;
    for (const method of [{ secure: true, label: "FTPS" }, { secure: false, label: "FTP" }]) {
      try {
        await client.access({
          host: FTP_HOST, port: 21, user: FTP_USER, password: FTP_PASS,
          secure: method.secure as any,
          secureOptions: { rejectUnauthorized: false },
        });
        connected = true;
        console.log(`Connected via ${method.label}`);
        break;
      } catch (e) {
        console.log(`${method.label} failed:`, e.message);
        client.close();
      }
    }
    if (!connected) throw new Error("Could not connect to FTP server");

    const basePath = "/Retailpoint/";
    console.log(`Listing ${basePath}...`);
    const baseList = await client.list(basePath);
    console.log(`Found ${baseList.length} items in ${basePath}`);

    // Collect all files
    const allFiles: { name: string; path: string; size: number }[] = [];
    async function collectFiles(dirPath: string) {
      try {
        const items = await client.list(dirPath);
        for (const item of items) {
          const fullPath = dirPath.endsWith("/") ? dirPath + item.name : dirPath + "/" + item.name;
          if (item.isDirectory) await collectFiles(fullPath);
          else allFiles.push({ name: item.name, path: fullPath, size: item.size });
        }
      } catch (e) { console.log(`Error listing ${dirPath}: ${e.message}`); }
    }

    await collectFiles(basePath);
    console.log(`Total files: ${allFiles.length}`);

    // Only import Le Mercier's file (RPPExportLM.xml = "LM" = Le Mercier)
    const inventoryFiles = allFiles.filter((f) => /RPPExportLM\.xml$/i.test(f.name));
    console.log(`Le Mercier XML file: ${inventoryFiles.length}`);
    console.log("File:", inventoryFiles.map((f) => `${f.name} (${f.size} bytes)`).join(", "));

    let products: any[] = [];
    const fileSummaries: any[] = [];

    for (const file of inventoryFiles) {
      try {
        const content = await downloadFile(client, file.path);
        console.log(`Downloaded ${file.name}: ${content.length} bytes`);
        console.log(`Preview: ${content.substring(0, 300)}`);

        fileSummaries.push({
          name: file.name, size: content.length,
          preview: content.substring(0, 300),
        });

        const parsed = parseRetailpointXML(content, products.length);
        console.log(`Parsed ${parsed.length} products from ${file.name}`);
        if (parsed.length > 0) console.log("First product:", JSON.stringify(parsed[0]));
        products.push(...parsed);
      } catch (e) {
        console.error(`Error processing ${file.name}:`, e.message);
        fileSummaries.push({ name: file.name, error: e.message });
      }
    }

    client.close();
    console.log(`Total products parsed: ${products.length}`);

    // Deduplicate by ID (keep last occurrence wins)
    const productMap = new Map<string, any>();
    for (const p of products) {
      productMap.set(p.id, p);
    }
    const uniqueProducts = [...productMap.values()];
    console.log(`Unique products after dedup: ${uniqueProducts.length}`);

    // Clear old products and insert new ones
    let upsertResult = null;
    if (uniqueProducts.length > 0) {
      // Delete existing products first
      await supabase.from("products").delete().neq("id", "___impossible___");
      console.log("Cleared old products");

      // Insert in batches of 500
      const batchSize = 500;
      let totalInserted = 0;
      for (let i = 0; i < uniqueProducts.length; i += batchSize) {
        const batch = uniqueProducts.slice(i, i + batchSize);
        const { data, error } = await supabase.from("products").insert(batch).select();
        if (error) {
          console.error(`Insert error (batch ${i}):`, error.message);
          upsertResult = { error: error.message, inserted: totalInserted };
          break;
        }
        totalInserted += data?.length || 0;
      }
      if (!upsertResult) upsertResult = { inserted: totalInserted };
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalFiles: allFiles.length,
        xmlFiles: inventoryFiles.length,
        productsParsed: products.length,
        uniqueProducts: uniqueProducts.length,
        upsertResult,
        sampleProducts: uniqueProducts.slice(0, 5),
        categories: [...new Set(uniqueProducts.map(p => p.cat))].filter(Boolean).sort(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message, stack: err.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
