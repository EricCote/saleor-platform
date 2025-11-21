import XLSX from 'xlsx';

export function GetDataFromFile(file) {
  // 1. Specify the path to your Excel file
  const excelFile = file;

  // 2. Read the workbook
  const workbook = XLSX.readFile(excelFile);

  // 3. Get the name of the first sheet
  const sheetName = workbook.SheetNames[0];

  // 4. Get the worksheet
  const worksheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(worksheet, { defval: null });
}
