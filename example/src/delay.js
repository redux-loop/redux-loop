export default function delay (milliseconds) {
  return new Promise((resolve, reject) => {
    const shouldFail = Math.random() <= 0.2;
    setTimeout(() => {
      if(shouldFail) reject();
      else resolve();
    }, milliseconds);
  });
}
