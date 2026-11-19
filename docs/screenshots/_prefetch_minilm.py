from sentence_transformers import SentenceTransformer

m = SentenceTransformer("all-MiniLM-L6-v2")
print("ok", len(m.encode("hello")))
