(() => {
  const hues = [12, 32, 48, 162, 210, 262, 328];
  let i = 0;
  document.addEventListener("click", () => {
    i = (i + 1) % hues.length;
    document.body.style.background = `hsl(${hues[i]} 45% 12%)`;
  });
})();
