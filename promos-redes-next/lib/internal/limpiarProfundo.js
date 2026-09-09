// Igual a limpiarProfundo() en app.js: recorre el objeto (y sus objetos/arrays
// anidados) y elimina cualquier clave sin nombre o con valor undefined, para no
// mandarle basura a Firestore.
export function limpiarProfundo(obj) {
  if (obj !== null && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (key.trim() === '' || obj[key] === undefined) {
        delete obj[key];
      } else {
        limpiarProfundo(obj[key]);
      }
    });
  }
  return obj;
}
