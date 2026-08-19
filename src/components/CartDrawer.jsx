import { fmt } from '../data/products.js';
const FREE = 150;
export default function CartDrawer({ cart, remove, close }) {
  const subtotal = cart.reduce((a, it) => a + it.price, 0);
  const tps = subtotal * 0.05, tvq = subtotal * 0.09975;
  return (
    <>
      <div className="overlay" onClick={close} />
      <aside className="drawer">
        <div className="drawer-head"><div>Votre panier</div><button onClick={close}>×</button></div>
        <div className="drawer-body">
          {cart.length === 0 && <p className="muted center">Votre panier est vide.</p>}
          {cart.map((it, i) => (
            <div key={i} className="cart-item">
              <img src={it.img} alt={it.name} />
              <div className="ci-info">
                <div>{it.name}</div>
                <div className="muted">Grandeur {it.size}</div>
                <div className="ci-price">{fmt(it.price)}</div>
              </div>
              <button className="ci-remove" onClick={() => remove(i)}>Retirer</button>
            </div>
          ))}
        </div>
        <div className="drawer-foot">
          <div className="row"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
          <div className="row sm"><span>TPS (5 %)</span><span>{fmt(tps)}</span></div>
          <div className="row sm"><span>TVQ (9,975 %)</span><span>{fmt(tvq)}</span></div>
          <div className="row total"><span>Total</span><span>{fmt(subtotal + tps + tvq)}</span></div>
          {subtotal > 0 && <div className="ship">{subtotal >= FREE ? 'Livraison gratuite incluse ✓' : 'Plus que ' + fmt(FREE - subtotal) + ' pour la livraison gratuite'}</div>}
          <button className="btn-primary big">PASSER À LA CAISSE</button>
        </div>
      </aside>
    </>
  );
}