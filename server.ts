import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

// Safe path resolution for both ESM and CJS
const getPaths = () => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      const filename = fileURLToPath(import.meta.url);
      return {
        __filename: filename,
        __dirname: path.dirname(filename)
      };
    }
  } catch (e) {
    // fall through
  }
  return {
    __filename: typeof __filename !== "undefined" ? __filename : "",
    __dirname: typeof __dirname !== "undefined" ? __dirname : "."
  };
};

const { __filename: resolvedFilename, __dirname: resolvedDirname } = getPaths();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes go here
  app.use(express.json());

  // Download automatico do logo oficial para a pasta public (garante existencia do icone no PWA)
  const logoUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuADYMPvZcaOSpHUoz7xjXH4_NJcY25qztiFideOgHchUZKhDCIoAyq_MGHgParQMmKcwudjYsYMEG0TCr3XaZvoDPdwhgOP69aaiYWcXIUEoQX0Ra1DCbFOr3bTIMz7JLCMI4XJDTJ0bjECIZfhV06N7LfW5TN63vQqhOogP521OSWtqiXBFJbV9vtNdePlGu6ecRVcuNbWfGIZugLjKYMuloDE98xQMY7_Vw6y7T4gzlmYr-7m3DQqOwEyMuaNC6tgBxOSbbR0jgY";
  const publicLogoPath = path.join(process.cwd(), "public", "icon-512.png");
  if (!fs.existsSync(publicLogoPath) || (fs.existsSync(publicLogoPath) && fs.statSync(publicLogoPath).size === 0)) {
    try {
      console.log("Baixando logotipo oficial da IPBA para a pasta public...");
      fetch(logoUrl)
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => {
          const buffer = Buffer.from(arrayBuffer);
          fs.mkdirSync(path.dirname(publicLogoPath), { recursive: true });
          fs.writeFileSync(publicLogoPath, buffer);
          console.log("Logotipo de PWA baixado com sucesso!");
        })
        .catch(err => console.error("Erro assincrono ao baixar logo:", err));
    } catch (err) {
      console.error("Falha ao baixar logotipo oficial:", err);
    }
  }

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = resolvedDirname;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
