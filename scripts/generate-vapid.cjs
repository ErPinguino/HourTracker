const webpush = require("web-push");

console.log("Generando VAPID keys...");
const vapidKeys = webpush.generateVAPIDKeys();

console.log("\n=============================================");
console.log("claves generadas con éxito");
console.log("=============================================\n");

console.log("Para entorno local (si usas supabase start):");
console.log(
  "Añade esto a tu archivo supabase/supabase.env o envíalas directamente en la terminal:",
);
console.log(`WEB_PUSH_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`WEB_PUSH_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log(`WEB_PUSH_SUBJECT="mailto:michaelhenao23j@gmail.com"`);

console.log("\n---------------------------------------------\n");

console.log("Para producción (Supabase CLI):");
console.log(
  `supabase secrets set WEB_PUSH_PUBLIC_KEY="${vapidKeys.publicKey}" WEB_PUSH_PRIVATE_KEY="${vapidKeys.privateKey}" WEB_PUSH_SUBJECT="mailto:michaelhenao23j@gmail.com"`,
);
