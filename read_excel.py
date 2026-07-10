import pandas as pd

df = pd.read_excel('CHEQUE DEVOLVIDO.xlsx')
print("Columns:", df.columns.tolist())
print("First row:", df.iloc[0].to_dict())
