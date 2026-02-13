const puppeteer = require("puppeteer");
const path = require("path");

async function generatePDF() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const htmlPath = path.join(__dirname, "week1-2-report.html");
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });

  const outputPath = path.join(__dirname, "VirtuMall-Reporte-Semana-1-2.pdf");

  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  console.log(`PDF generated: ${outputPath}`);
  await browser.close();
}

generatePDF().catch(console.error);
