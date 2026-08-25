const U = 'https://lemerciersg.com/wp-content/uploads/';
export const FREE_SHIPPING = 200;
export const products = [
  { id: '1', name: '26HN504 | Chemise NZA', brand: 'NZA New Zealand', cat: 'Chemises', price: 125, color: 'Grey Brown', sizes: ['M','G','TG','TTG'], img: U + '2026/08/26HN504-1-GREY_BROWN-0-dd95f0f656394f63be8e352c6a6a7c6e-650x813.jpg' },
  { id: '2', name: '26GN67632 | Pantalon NZA', brand: 'NZA New Zealand', cat: 'Pantalons', price: 169, color: 'Light Grey', sizes: ['M','G','TG','TTG'], img: U + '2026/08/26GN67632-1-LIGHT_GREY-0-d52efd7714a54b64915ab32cd015429a-400x400.jpg' },
  { id: '3', name: 'MT0500245 | Chandail Psycho Bunny', brand: 'Psycho Bunny', cat: 'Chandails', price: 178, color: 'Marine', sizes: ['P','M','G','TG'], img: U + '2026/08/MT0500245-1-435-0-70305dad46854ada8c3454bdea3d686a.jpg' },
  { id: '4', name: 'MT0500199 | Chandail Psycho Bunny', brand: 'Psycho Bunny', cat: 'Chandails', price: 190, color: 'Noir', sizes: ['P','M','G','TG'], img: U + '2026/08/MT0500199-1-001-0-d5abf2845a2c46f6a3647f3b93aa2b57-400x400.jpg' },
  { id: '5', name: 'MT0300189 | Chemise Psycho Bunny', brand: 'Psycho Bunny', cat: 'Chemises', price: 148, color: 'Noir', sizes: ['P','M','G','TG'], img: U + '2026/08/MT0300189-1-001-0-da4c229372084d409084b6528f2fee7c-400x400.jpg' },
  { id: '6', name: 'MT0200358 | Chandail Psycho Bunny', brand: 'Psycho Bunny', cat: 'Chandails', price: 98, color: 'Gris', sizes: ['P','M','G','TG'], img: U + '2026/08/MT0200358-1-049-0-db8e6bcb178a45148a873295c61d5301.jpg' },
  { id: '7', name: 'MB0700036 | Bermuda Psycho Bunny', brand: 'Psycho Bunny', cat: 'Bermudas', price: 150, color: 'Noir', sizes: ['P','M','G','TG'], img: U + '2026/08/MB0700036-1-001-0-2e7f733b6a1d49cb897cb80da3d9d25c-400x400.jpg' },
  { id: '8', name: '26HN830 | Veste sans manches NZA', brand: 'NZA New Zealand', cat: 'Vestes', price: 179, color: 'Ranger Green', sizes: ['M','G','TG','TTG'], img: U + '2026/08/26HN830-1-RANGER_GREEN-0-86024bde1cec4abba8fcb0773d68a0d5-650x813.jpg' },
  { id: '9', name: '26HN531 | Chemise NZA', brand: 'NZA New Zealand', cat: 'Chemises', price: 135, color: 'Dark Hunter', sizes: ['M','G','TG','TTG'], img: U + '2026/08/26HN531-1-DARK_HUNTER_MELANGE-0-72a5c927e25c49e5aa586cba1155a7a7-400x400.jpg' },
  { id: '10', name: 'Taye | Chemise Au Noir', brand: 'Au Noir', cat: 'Chemises', price: 185, color: 'Denim', sizes: ['P','G','TG','TTG','3TG'], img: U + '2026/08/TAYE-1-DENIM-0-25ce32e66c3341abb71313438a4b0018.jpg' },
  { id: '11', name: 'Tyler | Chemise Au Noir', brand: 'Au Noir', cat: 'Chemises', price: 185, color: 'Tobacco Navy', sizes: ['P','M','G','TG'], img: U + '2026/08/TYLER.-1-TOBACCO_NAVY-0-3dd554dd6ace432aa6d15eadf3708689-400x400.jpg' },
  { id: '12', name: 'Nicolas Strp | Chemise Au Noir', brand: 'Au Noir', cat: 'Chemises', price: 185, color: 'White', sizes: ['P','M','G','TG'], img: U + '2025/10/NICOLAS-STRP-1-WHITE-0-737ae42e52a54b7182ea876a2fb47adb-400x400.jpg' }
];
export const HERO_IMG = '/hero_here.jpg';
export const LOOKBOOK = [
  U + '2026/08/MT0500245-2-435-0-62a9f981c6fa47e29016a150d9d4291f.jpg',
  U + '2026/08/TAYE-2-DENOM-0-89d8041358eb4f02a0b76ce55fc48c79.jpg',
  U + '2026/08/MT0200358-2-049-0-a940470caa8b432da938e6b31004e34a.jpg',
  U + '2026/08/MT0500245-3-435-0-4f4c9be474f14a1fa66129cafcbdcdce.jpg'
];
export const fmt = n => n.toFixed(2).replace('.', ',') + ' $';
