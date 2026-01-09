# Example unstructured reviewer comments

Prompt used:

> Be a good copy editor and make some suggestions. Keep this local. Output format as a table: original sentence left, discussion middle, suggestion right.

Result copied straight from ChatGPT (pasted as plain text for the Import Comments modal):

1. Original: "This paper presents an comprehensive overview of recent advancements in natural language processing."  
   Discussion: Article/noun disagreement ("an" before consonant sound); otherwise fine.  
   Suggestion: "This paper presents a comprehensive overview of recent advancements in natural language processing."

2. Original: "We will discuss the various aproaches that has been developed in the past decade."  
   Discussion: Spelling error ("aproaches"), verb agreement ("has" with plural "approaches"), and slightly wordy.  
   Suggestion: "We discuss the various approaches that have been developed in the past decade."

3. Original: "The field have grown exponentially, with new models being released on a regular bases."  
   Discussion: Verb agreement ("field has"), "bases" -> "basis," and "on a regular basis" is slightly clichéd.  
   Suggestion: "The field has grown exponentially, with new models being released on a regular basis."

4. Original: "Its important to understand these developments for anyone working in the field."  
   Discussion: Missing apostrophe ("Its" -> "It is"/"It's"); could be slightly tightened.  
   Suggestion: "It is important for anyone working in the field to understand these developments."

5. Original: "In this study, we examined 50 different papers published between 2020-2023."  
   Discussion: "Between ... and ..." is standard; LaTeX usually uses an en dash "2020--2023"; "different" is redundant.  
   Suggestion: "In this study, we examined 50 papers published between 2020 and 2023."

6. Original: "The data shows that transformer-based models is dominating the landscape."  
   Discussion: In academic style, "data" is plural; verb agreement with "models."  
   Suggestion: "The data show that transformer-based models dominate the landscape."

7. Original: "We conducted extensive experiments to validate our hypothesis."  
   Discussion: Grammatically fine; "our hypothesis" suggests a single one—consider clarifying.  
   Suggestion: "We conducted extensive experiments to validate our main hypothesis."

8. Original: "Each experiment were carefully designed to test specific aspects of model performance."  
   Discussion: Subject/verb agreement ("experiment was").  
   Suggestion: "Each experiment was carefully designed to test specific aspects of model performance."

9. Original: "For any language model $L$ with vocabulary size $V$ and embedding dimension $d$, the computational complexity of self-attention is $O(n^2 \cdot d)$ where $n$ is the sequence length."  
   Discussion: Optional comma before "where"; you may want to clarify "per layer/per head," but that is content, not language.  
   Suggestion: "For any language model $L$ with vocabulary size $V$ and embedding dimension $d$, the computational complexity of self-attention is $O(n^2 \cdot d)$, where $n$ is the sequence length."

10. Original: "In conclusion, this study have shown that the landscape of NLP is rapidly evolving."  
    Discussion: Verb agreement ("study has"); "In conclusion" is often redundant.  
    Suggestion: "This study has shown that the landscape of NLP is rapidly evolving."

11. Original: "Future work should focus on developing more eficient models."  
    Discussion: Spelling error ("eficient" -> "efficient").  
    Suggestion: "Future work should focus on developing more efficient models."
