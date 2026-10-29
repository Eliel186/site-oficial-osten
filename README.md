# Site oficial Osten

Site one-page da Osten, criadora do Método Fluxo Previsível: captação, conversão e retenção em um único sistema.

## Estrutura
| Arquivo | O que é |
|---|---|
| `index.html` | A página inteira, com o CSS |
| `script.js` | Ondas da hero, menu que vira estrela, curva de luz, palavras que sobem com o scroll, trilho de benefícios e formulário de análise (4 perguntas que abrem o WhatsApp) |
| `pesca.js` | Animação do boneco pescando na seção "Captação" (roda só quando aparece na tela) |
| `servidor.js` | Servidor local sem dependências (com suporte a vídeo) |
| `assets/` | Logos, imagens e o vídeo da planta nascendo (`planta-nascendo.mp4`) |

## Rodar localmente
Abra o `index.html` no navegador, ou:

```
node servidor.js
```

e acesse http://localhost:5180.

Site estático: pode ser publicado direto na Vercel, Netlify ou GitHub Pages, sem build.
