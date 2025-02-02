import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';

// Configuración de ignorados
const ignoredDirectories = ['node_modules', 'dist', '.git', 'coverage'];
const ignoredFiles = [
  '.DS_Store',
  'package-lock.json',
  'README.md',
  'extractFiles.ts',
  'backend.txt',
  'codigo.txt',
  'LICENSE.txt',
];
const ignoredExtensions = [
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.avif',
  '.webp',
  '. ttf',
];
const outputFilePath = path.join(__dirname, 'backend.txt');

// Crear o vaciar el archivo de salida
fs.writeFileSync(outputFilePath, '');
let fileList: string[] = [];

// Función para recorrer el directorio
function traverseDirectory(directory: string, depth = 0, maxDepth = Infinity) {
  if (depth > maxDepth) return;

  fs.readdirSync(directory, { withFileTypes: true }).forEach((dirent) => {
    const fullPath = path.join(directory, dirent.name);

    if (dirent.isDirectory() && ignoredDirectories.includes(dirent.name))
      return;
    if (
      dirent.isFile() &&
      (ignoredFiles.includes(dirent.name) ||
        ignoredExtensions.includes(path.extname(dirent.name).toLowerCase()))
    )
      return;

    if (dirent.isDirectory()) {
      traverseDirectory(fullPath, depth + 1, maxDepth);
    } else if (dirent.isFile()) {
      fileList.push(fullPath);
    }
  });
}

// Escribir índice y contenido de archivos
function writeIndex() {
  let indexContent = 'Índice de archivos:\n\n';
  fileList.forEach((filePath, index) => {
    const relativePath = path.relative(__dirname, filePath);
    indexContent += `${index + 1}. ${relativePath}\n`;
  });
  fs.appendFileSync(outputFilePath, indexContent + '\n\n');
}

function appendFileWithHeader(filePath: string) {
  const relativePath = path.relative(__dirname, filePath);
  const header = `
--------------------
${relativePath}
--------------------

`;
  const fileContent = fs.readFileSync(filePath, 'utf8');
  fs.appendFileSync(outputFilePath, header + fileContent + '\n\n');
}

// Preguntas de selección de directorio y profundidad
async function promptUser() {
  const { mode } = await inquirer.prompt({
    type: 'list',
    name: 'mode',
    message: '¿Qué te gustaría extraer?',
    choices: [
      { name: 'Extraer todo el proyecto', value: 'all' },
      { name: 'Extraer una carpeta específica', value: 'folder' },
    ],
  });

  if (mode === 'all') {
    traverseDirectory(__dirname);
    writeIndex();
    fileList.forEach((filePath) => appendFileWithHeader(filePath));
    console.log(`Archivo generado en: ${outputFilePath}`);
  } else {
    const { selectedDirectory } = await selectDirectory(__dirname, 0);
    const { depth } = await inquirer.prompt({
      type: 'number',
      name: 'depth',
      message: '¿Hasta qué nivel de profundidad quieres extraer?',
      default: 5,
    });

    traverseDirectory(selectedDirectory, 0, depth);
    writeIndex();
    fileList.forEach((filePath) => appendFileWithHeader(filePath));
    console.log(`Archivo generado en: ${outputFilePath}`);
  }
}

// Función recursiva para seleccionar un directorio
async function selectDirectory(
  currentPath: string,
  depth: number,
): Promise<{ selectedDirectory: string }> {
  const directories = fs
    .readdirSync(currentPath, { withFileTypes: true })
    .filter(
      (dirent) =>
        dirent.isDirectory() && !ignoredDirectories.includes(dirent.name),
    )
    .map((dirent) => dirent.name);

  const { selectedDirectory } = await inquirer.prompt({
    type: 'list',
    name: 'selectedDirectory',
    message: `Selecciona una carpeta (actual: ${currentPath})`,
    choices: [
      ...directories.map((dir) => ({
        name: dir,
        value: path.join(currentPath, dir),
      })),
      { name: 'Seleccionar esta carpeta', value: currentPath },
    ],
  });

  return selectedDirectory === currentPath || depth >= 5
    ? { selectedDirectory: currentPath }
    : selectDirectory(selectedDirectory, depth + 1); // Usa el valor directamente
}

promptUser();
