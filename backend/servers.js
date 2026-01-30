import express from "express"
import cors from "cors"
import fetch from "node-fetch"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()

app.use(cors())
app.use(express.json())

const pastaFrontend = path.join(__dirname, "..", "frontend")
app.use(express.static(pastaFrontend))

app.get("/", (req, res) => {
  res.sendFile(path.join(pastaFrontend, "index.html"))
})

app.post("/analisar", async (req, res) => {
  const { code, language } = req.body
  const token = process.env.HF_TOKEN?.trim()

  if (!token || token === "") {
    return res.json({ result: "ERRO: Token não encontrado no arquivo .env" })
  }

  if (!code || !code.trim()) {
    return res.json({ result: "ERRO: Nenhum código foi enviado para análise." })
  }

  try {
    const response = await fetch(
      "https://router.huggingface.co/novita/v3/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528",
          messages: [
            { 
              "role": "system", 
              "content": "Você é um professor de programação. Seja BREVE e DIRETO. Explique em no máximo 3-4 parágrafos curtos: 1) O que faz, 2) Como funciona, 3) Uma melhoria. Use português brasileiro. Não use tags <think>. Não use markdown excessivo." 
            },
            { 
              "role": "user", 
              "content": language === "auto" 
                ? `Explique brevemente este código:\n\n${code}` 
                : `Explique brevemente este código ${language}:\n\n${code}` 
            }
          ],
          max_tokens: 500
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("DEBUG IA:", data)
      
      if (response.status === 401) {
        return res.json({ result: "ERRO: Token HF_TOKEN inválido. Verifique seu arquivo .env" })
      }
      
      if (response.status === 503) {
        return res.json({ result: "IA em carregamento. Aguarde 10-20 segundos e tente novamente." })
      }
      
      return res.json({ result: `ERRO da API: ${data.error || 'Erro desconhecido'}` })
    }

    if (data.choices && data.choices[0] && data.choices[0].message) {
      res.json({ result: data.choices[0].message.content })
    } else {
      console.error("Resposta inesperada:", data)
      res.json({ result: "ERRO: Resposta inesperada da IA. Tente novamente." })
    }

  } catch (e) {
    console.error("ERRO NO TERMINAL:", e.message)
    console.error("ERRO COMPLETO:", e)
    res.json({ result: `Erro de conexão: ${e.message}` })
  }
})

const PORT = process.env.PORT || 3000

app.get("/health", (req, res) => {
  res.status(200).send("OK")
})

app.listen(PORT, () => {
  console.log(`SayCode Online em http://localhost:${PORT}`)
})
