import { Resend } from "resend";

// ── Resend client singleton (mirrors stripe.ts pattern) ────────────

function createResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const globalForResend = globalThis as unknown as {
  _resend: Resend | null | undefined;
};

const resend: Resend | null =
  globalForResend._resend ?? createResendClient();

if (process.env.NODE_ENV !== "production") {
  globalForResend._resend = resend;
}

export function isEmailConfigured(): boolean {
  return resend !== null;
}

// ── Core send helper (fire-and-forget safe) ────────────────────────

const EMAIL_FROM =
  process.env.EMAIL_FROM || "VirtuMall <noreply@virtumall.com>";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME || "VirtuMall";

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
  } catch (error) {
    console.error("[Email] Failed to send:", { to, subject, error });
  }
}

// ── Shared HTML layout wrapper ─────────────────────────────────────

function emailLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:8px;padding:32px;border:1px solid #e4e4e7;">
      <h2 style="color:#18181b;margin-top:0;">${title}</h2>
      ${bodyContent}
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
      <p style="font-size:12px;color:#a1a1aa;">
        Este correo fue enviado por ${APP_NAME}.
        <a href="${APP_URL}" style="color:#6366f1;">${APP_URL}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Template 1: ORDER_COMPLETED → Buyer ────────────────────────────

export interface EmailOrderItem {
  productName: string;
  quantity: number;
  totalPrice: number;
}

export async function sendOrderCompletedEmail(
  buyerEmail: string,
  orderNumber: string,
  items: EmailOrderItem[],
  total: number
): Promise<void> {
  const itemRows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #f4f4f5;">${i.productName}</td>
          <td style="padding:8px;border-bottom:1px solid #f4f4f5;text-align:center;">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #f4f4f5;text-align:right;">$${i.totalPrice.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const html = emailLayout(
    "Pedido completado",
    `<p>Tu pedido <strong>#${orderNumber}</strong> ha sido completado exitosamente.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;">
       <thead>
         <tr style="background:#f4f4f5;">
           <th style="padding:8px;text-align:left;">Producto</th>
           <th style="padding:8px;text-align:center;">Cant.</th>
           <th style="padding:8px;text-align:right;">Precio</th>
         </tr>
       </thead>
       <tbody>${itemRows}</tbody>
       <tfoot>
         <tr>
           <td colspan="2" style="padding:8px;font-weight:bold;">Total</td>
           <td style="padding:8px;text-align:right;font-weight:bold;">$${total.toFixed(2)}</td>
         </tr>
       </tfoot>
     </table>
     <p>Puedes ver los detalles y codigos en tu panel:</p>
     <a href="${APP_URL}/buyer/orders" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">Ver mis pedidos</a>`
  );

  await sendEmail(
    buyerEmail,
    `Pedido #${orderNumber} completado - ${APP_NAME}`,
    html
  );
}

// ── Template 2: NEW_ORDER → Seller ─────────────────────────────────

export async function sendNewOrderEmail(
  sellerEmail: string,
  orderNumber: string,
  items: EmailOrderItem[],
  total: number,
  storeName: string
): Promise<void> {
  const itemList = items
    .map(
      (i) =>
        `<li>${i.productName} x${i.quantity} — $${i.totalPrice.toFixed(2)}</li>`
    )
    .join("");

  const html = emailLayout(
    "Nueva venta recibida",
    `<p>Hola <strong>${storeName}</strong>, tienes una nueva venta.</p>
     <p>Orden: <strong>#${orderNumber}</strong></p>
     <ul>${itemList}</ul>
     <p><strong>Total:</strong> $${total.toFixed(2)}</p>
     <a href="${APP_URL}/seller/orders" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">Ver pedidos</a>`
  );

  await sendEmail(
    sellerEmail,
    `Nueva venta #${orderNumber} - ${APP_NAME}`,
    html
  );
}

// ── Template 3: REFUND_PROCESSED → Buyer ───────────────────────────

export async function sendRefundProcessedEmail(
  buyerEmail: string,
  orderNumber: string,
  refundAmount: number,
  newBalance: number
): Promise<void> {
  const html = emailLayout(
    "Reembolso procesado",
    `<p>Tu solicitud de reembolso para la orden <strong>#${orderNumber}</strong> ha sido procesada.</p>
     <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin:16px 0;">
       <p style="margin:0;font-size:18px;color:#16a34a;font-weight:bold;">+$${refundAmount.toFixed(2)} acreditados</p>
       <p style="margin:4px 0 0;color:#4b5563;">Nuevo saldo de billetera: <strong>$${newBalance.toFixed(2)}</strong></p>
     </div>
     <a href="${APP_URL}/buyer/wallet" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">Ver billetera</a>`
  );

  await sendEmail(
    buyerEmail,
    `Reembolso procesado — Orden #${orderNumber} - ${APP_NAME}`,
    html
  );
}

// ── Template 4: KYC Result → Seller ────────────────────────────────

export async function sendKycResultEmail(
  sellerEmail: string,
  approved: boolean,
  reviewNote?: string
): Promise<void> {
  const title = approved
    ? "Verificacion aprobada"
    : "Verificacion rechazada";

  const body = approved
    ? `<p>Felicidades! Tu cuenta ha sido verificada exitosamente.</p>
       <p>Ya puedes publicar productos en la plataforma.</p>
       <a href="${APP_URL}/seller/products" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;">Publicar productos</a>`
    : `<p>Lamentablemente, tu verificacion ha sido rechazada.</p>
       ${reviewNote ? `<p><strong>Motivo:</strong> ${reviewNote}</p>` : ""}
       <p>Revisa tus documentos e intenta de nuevo.</p>
       <a href="${APP_URL}/seller/kyc" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">Revisar documentos</a>`;

  const html = emailLayout(title, body);
  await sendEmail(sellerEmail, `${title} - ${APP_NAME}`, html);
}
