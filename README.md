# Lucas Melo — portfólio

**Meu portfólio em formato de site tradicional: preto, tipografia editorial e animações contidas.**

[![Acessar o portfólio](https://img.shields.io/badge/Acessar%20o%20portf%C3%B3lio-lucasstml.github.io%2Flucas--melo-0a0a0a?style=for-the-badge)](https://lucasstml.github.io/lucas-melo/)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-puro-F7DF1E?logo=javascript&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deploy%20autom%C3%A1tico-222222?logo=githubpages&logoColor=white)
![Zero dependências](https://img.shields.io/badge/depend%C3%AAncias-0-2E8B1D)

---

## Sobre

O conteúdo é o mesmo do [PortfolioXP](https://github.com/LucassTml/PortfolioXP) (sobre mim, projetos, habilidades e trajetória), só que num site de rolagem comum, sem janelas nem área de trabalho. A ideia foi deixar tudo simples e elegante e guardar a complexidade para os detalhes.

Tudo é **HTML, CSS e JavaScript puros**, sem biblioteca, framework ou etapa de build. As únicas coisas carregadas de fora são as fontes (Instrument Serif, Inter e JetBrains Mono) e a API pública do GitHub.

## Duas versões

| Endereço | O que é |
|---|---|
| [`/`](https://lucasstml.github.io/lucas-melo/) | O portfólio principal, moderno e em preto |
| [`/curriculo/`](https://lucasstml.github.io/lucas-melo/curriculo/) | Meu currículo como uma home page de 1996: HTML 3.2, tabelas e nenhuma linha de CSS ou JavaScript |

## Detalhes que dá para encontrar

- **Abertura** com contador e o nome subindo letra por letra (só na primeira visita da sessão).
- **Campo de pontos** no fundo do hero, com física de mola: os pontos fogem do cursor e um clique solta uma onda.
- **Cursor próprio** que muda de tamanho e mostra uma palavra sobre links e projetos.
- **Prévias geradas em canvas** para cada projeto ao passar o mouse: forma de onda para o Audian, terminal para o OpenlyAntigravity, SQL sendo escrito para o Text-to-SQL, grafo para o Overwatch DataMeta, camadas bronze/prata/ouro para o CineData e assim por diante.
- **Filtros** por área com a lista se reorganizando, e cada projeto abre com descrição e links.
- **GitHub ao vivo:** os repositórios atualizados recentemente e o total de repositórios vêm da API do GitHub (com cache na sessão).
- **Faixa de tecnologias** que acelera, inverte e inclina conforme a velocidade da rolagem.
- **Laboratório** com dois visualizadores que vieram do PortfolioXP:
  - Busca de caminhos com BFS, DFS, Dijkstra e A\*, em labirinto ou num campo com lama (custo 5). Dá para desenhar paredes e arrastar o início e o fim, e o caminho é recalculado na hora.
  - Ordenação com Bubble, Insertion, Selection, Merge, Quick e Heap, contando comparações e escritas.
- **Paleta de comandos** (`Ctrl` + `K`, `⌘` + `K` ou `/`): ir para seções, abrir projetos, copiar o e-mail, rodar algoritmos do laboratório.
- **Relógio de Recife** no topo e no rodapé.
- Respeita `prefers-reduced-motion`: com menos movimento, as animações são desligadas e o conteúdo aparece direto.

## Estrutura

```
index.html             conteúdo do portfólio (textos, projetos, trajetória)
assets/css/style.css   cores, tipografia, layout e animações
assets/js/main.js      abertura, cursor, revelações, hero, prévias, GitHub, paleta
assets/js/lab.js       busca de caminhos e ordenação
assets/img/favicon.svg
curriculo/index.html   o currículo em HTML de 1996
```

Para adicionar um projeto, copie um `<li class="project">` em `index.html` e, se quiser uma prévia, crie uma cena com o mesmo nome do `data-preview` em `SCENES`, no `main.js`.

Para rodar localmente, sirva a pasta com qualquer servidor estático (por exemplo `python -m http.server`) e abra `http://localhost:8000`.

## Contato

**Lucas Melo**, estudante de Engenharia da Computação na Universidade de Pernambuco (UPE, Escola Politécnica), em Recife.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Lucas%20Melo-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/lucas-eduardo-melo-tenorio-05326a311/)
[![GitHub](https://img.shields.io/badge/GitHub-LucassTml-181717?logo=github&logoColor=white)](https://github.com/LucassTml)
