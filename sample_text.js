(function() {
  const SAMPLE = `\\documentclass{article}
\\begin{document}

\\title{Sample Text: Load Your Own by Pasting Here or Use New Text Above}
\\author{John Smith}
\\maketitle

\\section{Introduction}
This paper presents an comprehensive overview of recent advancements in natural language processing. We will discuss the various aproaches that has been developed in the past decade.

The field have grown exponentially, with new models being released on a regular bases. Its important to understand these developments for anyone working in the field.

\\section{Methodology}
In this study, we examined 50 different papers published between 2020-2023. The data shows that transformer-based models is dominating the landscape.

We conducted extensive experiments to validate our hypothesis. Each experiment were carefully designed to test specific aspects of model performance.

\\section{Theorem}
\\textbf{Theorem 1:} For any language model $L$ with vocabulary size $V$ and embedding dimension $d$, the computational complexity of self-attention is $O(n^2 \\cdot d)$ where $n$ is the sequence length.

\\textbf{Proof:} Let us consider the attention mechanism. For each token in the sequence, we compute attention scores with all other tokens. This requires $n$ dot products for each of the $n$ tokens. Since each dot product operates on $d$-dimensional vectors, the total complexity is $n \\times n \\times d = O(n^2 \\cdot d)$. However, this assumes that the model processes all tokens simultaneously, which may not be true for all architectures.

\\section{Conclusion}
In conclusion, this study have shown that the landscape of NLP is rapidly evolving. Future work should focus on developing more efficent models.

\\end{document}`;

  window.DEFAULT_SAMPLE_TEXT = SAMPLE;
  window.DEFAULT_SAMPLE_TEXT_TRIMMED = SAMPLE.trim();
})();
