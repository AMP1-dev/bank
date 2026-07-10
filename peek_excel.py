import zipfile
import xml.etree.ElementTree as ET

def peek_excel(filename):
    with zipfile.ZipFile(filename, 'r') as z:
        # Get shared strings
        with z.open('xl/sharedStrings.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {'ns': root.tag.split('}')[0].strip('{')} if '}' in root.tag else {}
            strings = [elem.text for elem in root.findall('.//ns:t', ns)]
            
        # Get sheet 1
        with z.open('xl/worksheets/sheet1.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {'ns': root.tag.split('}')[0].strip('{')} if '}' in root.tag else {}
            
            # Get first 15 rows
            rows = root.findall('.//ns:row', ns)[:15]
            for i, row in enumerate(rows):
                row_data = []
                for cell in row.findall('.//ns:c', ns):
                    val_node = cell.find('ns:v', ns)
                    if val_node is not None:
                        val = val_node.text
                        if cell.get('t') == 's':  # Shared string
                            val = strings[int(val)]
                        row_data.append(val)
                    else:
                        row_data.append(None)
                if any(x is not None for x in row_data):
                    print(f"Row {row.get('r')}:", row_data)

peek_excel('CHEQUE DEVOLVIDO.xlsx')
