import "sapling-island";

if (typeof document !== "undefined") {
  const existingStyle = document.querySelector("style[data-treesap-islands]");

  if (!existingStyle) {
    const style = document.createElement("style");
    style.dataset.treesapIslands = "";
    style.textContent = "sapling-island { display: contents; }";
    document.head.append(style);
  }
}
