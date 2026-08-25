import { fmt } from '../data/products.js';
import { useCart } from '../context/CartContext.jsx';

export default function CartDrawer({ close, goCheckout }) {
  const { cart, remove, setQty, subtotal, freeShippingThreshold, shippingFlat } = useCart();

  const remaining = freeShippingThreshold - subtotal;
  const qualifiesFree = subtotal >= freeShippingThreshold;

  return (
    <>
      <div className="overlay" onClick={close} />
      <aside className="drawer">
        <div className="drawer-head"><div>Votre panier</div><button onClick={close}>×</button></div>
        <div className="drawer-body">
          {cart.length === 0 && <p className="muted center">Votre panier est vide.</p>}
          {cart.map((it, i) => (
            <div key={i} className="cart-item">
              <img src={it.image || it.img} alt={it.name} />
              <div className="ci-info">
                <div>{it.name}</div>
                {it.brand && <div className="muted" style={{ fontSize: 12 }}>{it.brand}</div>}
                <div className="muted">
                  {it.color && `Couleur: ${it.color}`}
                  {it.color && it.size ? ' · ' : ''}
                  {it.size && `Taille: ${it.size}`}
                  {!it.color && !it.size && ''}
                </div>
                <div className="ci-price">{fmt(it.price)}</div>
                <div className="ci-qty">
                  <button onClick={() => setQty(i, it.quantity - 1)}>−</button>
                  <span>{it.quantity}</span>
                  <button onClick={() => setQty(i, it.quantity + 1)}>+</button>
                </div>
              </div>
              <button className="ci-remove" onClick={() => remove(i)}>Retirer</button>
            </div>
          ))}
        </div>
        <div className="drawer-foot">
          <div className="row"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
          <div className="ship-info">
            {cart.length > 0 && (
              qualifiesFree
                ? 'Livraison gratuite incluse ✓'
                : `Plus que ${fmt(remaining)} pour la livraison gratuite`
            )}
          </div>
          <div className="ship-note">Livraison {shippingFlat} $ · gratuite dès {freeShippingThreshold} $</div>
          <button
            className="btn-primary big"
            disabled={cart.length === 0}
            onClick={() => { close(); goCheckout(); }}
          >PASSER À LA CAISSE</button>
        </div>
      </aside>
    </>
  );
}
