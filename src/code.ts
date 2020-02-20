figma.showUI(__html__, { width: 400, height: 578 });

function checkWidth(selec) {
  if (selec) {
    figma.ui.resize(516, 578)
  } else {
    figma.ui.resize(400, 578)
  }
}

function getSelc() {
  if (figma.currentPage.selection && figma.currentPage.selection[0] && figma.currentPage.selection[0].type !== "GROUP") {
    return figma.currentPage.selection[0]
  } else {
    return ""
  }
}

let s = getSelc();
checkWidth(s);

figma.on("selectionchange", () => {
  s = getSelc();
  checkWidth(s);
  figma.ui.postMessage(
      { selection: s ? s : "", type: "selection"}
  );
});

figma.ui.onmessage = msg => {
  let node = msg.selection ? figma.getNodeById(msg.selection.id) : "";
  let colors = {};

  switch (msg.type) {
    case 'getSelection':
      s = getSelc();
      checkWidth(s);
      figma.ui.postMessage({selection: s, type: "selection"});
      break;

    case 'copy':
      figma.notify(`✨ ${msg.str.toUpperCase()} has been copied to your clipboard`, {timeout: 1500})
      break;

    case 'getColors':
      if (node) {
        colors = {};

        let flls;
        let f = node.fills.length;
        let g;
        let s;

        if (f > 0) {
          g = node.fills.filter(e => (e.type.indexOf('GRADIENT') != -1)).length;
          s = node.fills.filter(e => (e.type == 'SOLID')).length;
        }

        if (g <= 0 && s <= 0) {
          flls = false;
        } else {
          flls = true;
        }

        colors.fills = flls ? node.fills : [];
        colors.strokes = node.strokes.length > 0 ? node.strokes : [];
        colors.effects = (node.effects.length > 0 && node.effects.filter(e => e.type.indexOf('SHADOW') != -1).length > 0) ? node.effects : [];

        figma.ui.postMessage({colors: colors, type: "colors"});
        if (colors.fills.length > 0 || colors.strokes.length > 0 || colors.effects.length > 0) {
          figma.notify(`🎨 Colors has been loaded`, {timeout: 1500})
        }
      } else {
        figma.ui.postMessage({colors: "", type: "colors"});
      }

      break;

    case 'setColors':
      if (node) {
        colors = msg.colors;
        if (colors.fills.length > 0) node.fills = colors.fills;
        if (colors.strokes.length > 0) node.strokes = colors.strokes;
        if (colors.effects.length > 0) node.effects = colors.effects;
      }

      break;
  }
};