<template>
  <div>
    <div id="picker">
      <div id="display">
        <canvas style="position:absolute;left:0" height="400" width="400"></canvas>
        <svg style="position:absolute;left:0" height="400" width="400">
          <circle cx="200" cy="200" fill="none" stroke-width="2" stroke="#ffffff" r="44.52288917362272"></circle>
          <circle cx="200" cy="200" r="2" fill="#ffffff"></circle>
          <circle cx="200" cy="200" r="190" fill="none" stroke="white" stroke-width="1"></circle>
          <circle cx="355.50006334855993" cy="200" r="4" fill="none" stroke-width="2" stroke="#ffffff" style="display: inline;"></circle>
        </svg>
      </div>
      <table>
        <tbody>
        <tr id="control-h">
          <td class="cell-input">
            <input type="number" min="0" max="360" step="any" class="counter counter-hue" tabindex="0">
          </td>
          <td>
            <div class="range-slider">
            </div>
          </td>
          <td class="picker-label">H</td>
        </tr>
        <tr id="control-s">
          <td class="cell-input">
            <input type="number" step="any" min="0" max="100" class="counter counter-saturation">
          </td>
          <td>
            <div class="range-slider">
            </div>
          </td>
          <td class="picker-label">S</td>
        </tr>
        <tr id="control-l">
          <td class="cell-input">
            <input type="number" step="any" min="0" max="100" class="counter counter-lightness">
          </td>
          <td>
            <div class="range-slider"></div>
          </td>
          <td class=" picker-label">L</td>
        </tr>
        <tr>
          <td class="cell-input cell-input-hex">
            <input class="input-hex" ref="inputHex" pattern="#?[0-9a-fA-F]{6}">
          </td>
          <td title="Click to copy">
            <div @click="copy" class="swatch">
            </div>
          </td>
          <td></td>
        </tr>
        </tbody>
      </table>
    </div>
    <div  v-if="this.colors" @click="reloadColors" id="reload">Reload colors</div>
    <aside v-if="this.colors" id="colorList" @click="removeCtx">
      <div v-if="fillsSize()" class="colorGroup" id="fills">
        <div class="cat">Fills</div>


        <div v-for="(f, i) in this.colors.fills.slice().reverse()" :index="i" class="fill" v-show="f.type !== 'IMAGE'">


          <div v-if="f.type !== 'IMAGE'" class="type">
            {{ f.type | capitalize }}
          </div>


          <div v-if="f.color" class="colors">

            <div class="color" @click.self="setActive" type="fills" :pindex="i" index="">
              <div class="icon" :style="{ backgroundColor: rgbToHex(f.color) }" @click="setActive"></div>
              <div class="hex" @click="setActive">{{ f.color | rgbToHex | removeHash }}</div>
            </div>

          </div>

          <div v-if="f.gradientStops" class="colors">

            <div v-for="(c, k) in f.gradientStops" class="color" @click.self="setActive" type="fills" :pindex="i" :index="k">
              <div class="icon" :style="{ backgroundColor: rgbToHex(c.color) }" @click="setActive"></div>
              <div class="hex" @click="setActive">{{ c.color | rgbToHex | removeHash }}</div>
            </div>

          </div>


        </div>


      </div>
      <div v-else class="colorGroup h" id="fills">
        <div class="cat">No fills</div>
      </div>
      <div v-if="this.colors.strokes.length > 0" class="colorGroup" id="strokes">
        <div class="cat">Strokes</div>

        <div v-for="(f, i) in this.colors.strokes.slice().reverse()" :index="i" class="fill">


          <div class="type">
            {{ f.type | capitalize }}
          </div>


          <div v-if="f.color" class="colors">

            <div class="color" @click.self="setActive" type="strokes" :pindex="i" index="">
              <div class="icon" :style="{ backgroundColor: rgbToHex(f.color) }" @click="setActive"></div>
              <div class="hex" @click="setActive">{{ f.color | rgbToHex | removeHash }}</div>
            </div>

          </div>

          <div v-if="f.gradientStops" class="colors">

            <div v-for="(c, k) in f.gradientStops" class="color" @click.self="setActive" type="strokes" :pindex="i" :index="k">
              <div class="icon" :style="{ backgroundColor: rgbToHex(c.color) }" @click="setActive"></div>
              <div class="hex" @click="setActive">{{ c.color | rgbToHex | removeHash }}</div>
            </div>

          </div>


        </div>


      </div>
      <div v-else class="colorGroup h" id="strokes"> <div class="cat">No strokes</div> </div>
      <div v-if="this.colors.effects.filter(e => e.type.indexOf('SHADOW') != -1).length > 0" class="colorGroup" id="effects">
        <div class="cat">Effects</div>

        <div v-for="(f, i) in this.colors.effects.slice().reverse()" :index="i" class="fill" v-show="f.type.indexOf('SHADOW') != -1">


          <div v-if="f.type.indexOf('SHADOW') != -1" class="type">
            {{ f.type | capitalize }}
          </div>


          <div v-if="f.color" class="colors">

            <div class="color" @click.self="setActive" type="effects" :pindex="i" index="">
              <div class="icon" :style="{ backgroundColor: rgbToHex(f.color) }" @click="setActive"></div>
              <div class="hex" @click="setActive">{{ f.color | rgbToHex | removeHash }}</div>
            </div>

          </div>


        </div>
      </div>
      <div v-else class="colorGroup h" id="effects"> <div class="cat">No effects</div> </div>
    </aside>
  </div>
</template>

<script>
  const colorJs = require("color-js");
  import * as copy from 'copy-to-clipboard';

  const inp = new Event('input', {
    bubbles: true,
    cancelable: true,
  });

  export default {
    name: "App",
    data() {
      return {
        selection: "",
        colors: "",
        ctx: "",
        hex: "",
      };
    },
    filters: {
      capitalize: function (value) {
        if (!value) return ''
        value = value.toString().toLowerCase().replace('gradient_',"").replace('_', ' ')
        return value.charAt(0).toUpperCase() + value.slice(1)
      },
      rgbToHex: function(value) {
        if (!value) return ''
        let hex = colorJs(`rgb(${Math.round(255 * value.r)}, ${Math.round(255 * value.g)}, ${Math.round(255 * value.b)})`).toCSS();
        return hex
      },
      removeHash: function(value) {
        if (!value) return ''
        return value.replace('#','')
      }
    },
    watch: {
      hex: function () {
        if (this.ctx) {
          const c = colorJs(this.hex);
          const r = c.getRed();
          const g = c.getGreen();
          const b = c.getBlue();
          let aclr = this.colors[this.ctx.type].slice().reverse();
          let bclr = aclr[this.ctx.pindex];
          let cclr;

          if (this.ctx.index) {
            cclr = bclr.gradientStops[this.ctx.index].color
          } else {
            cclr = bclr.color
          }
          cclr.r = r;
          cclr.g = g;
          cclr.b = b;

          this.colors[this.ctx.type] = aclr.reverse();
        }
      },
      colors: {
        deep: true,
        handler() {
          this.setColors();
        }
      }
    },
    methods: {
      fillsSize() {
        let g = this.colors.fills.filter(e => (e.type.indexOf('GRADIENT') != -1)).length;
        let s = this.colors.fills.filter(e => (e.type =='SOLID')).length;

        if (g <= 0 && s <= 0) {
          return false
        } else {
          return true
        }
      },
      rgbToHex (value) {
        return this.$options.filters.rgbToHex(value);
      },
      getSelection() {
        parent.postMessage(
                { pluginMessage: { type: "getSelection" } },
                "*"
        );
      },
      setColors() {
        parent.postMessage(
                { pluginMessage: { type: "setColors", selection: this.selection, colors: this.colors } },
                "*"
        );
      },
      reloadColors(event) {
        this.getColors();
        this.removeCtx(event);
      }
      ,
      getColors(event) {
        parent.postMessage(
                { pluginMessage: { type: "getColors", selection: this.selection } },
                "*"
        );
        this.removeActive();
      },
      copy() {
        copy(this.hex.toUpperCase())
        parent.postMessage(
                { pluginMessage: { type: "copy", str: this.hex } },
                "*"
        );
      },
      inputHexChange () {
        this.hex = this.$refs.inputHex.value;
      },
      setActive(event) {
        this.ctx = "";
        const clicked = event.target.classList.contains('color') ? event.target : event.target.parentNode;

        const inputHex = document.querySelectorAll('input.input-hex')[0];
        let cs;

        if (document.querySelectorAll('.color.selected')) {
          cs = document.querySelectorAll('.color.selected');
          for (let i = 0; i < cs.length; i++) {
            cs[i].classList.remove('selected');
          }
        }

        if (cs[0] != clicked) {
          const ctx = {
            type: clicked.getAttribute('type'),
            pindex: clicked.getAttribute('pindex'),
            index: clicked.getAttribute('index')
          }
          this.ctx = ctx;

          clicked.classList.add("selected");
          inputHex.value = "#" + clicked.querySelectorAll('.hex')[0].textContent;

          inputHex.dispatchEvent(inp);
        }
      },
      removeCtx(event) {
        const clicked = event.target.classList;

        if (document.querySelectorAll('.color.selected') && !clicked.contains('color') && !clicked.contains('hex') && !clicked.contains('icon')) {
          this.ctx = "";
          let cs = document.querySelectorAll('.color.selected');
          for (let i = 0; i < cs.length; i++) {
            cs[i].classList.remove('selected');
          }
        }
      },
      removeActive() {
        if (document.querySelectorAll('.color.selected')) {
          this.ctx = "";
          let cs = document.querySelectorAll('.color.selected');
          for (let i = 0; i < cs.length; i++) {
            cs[i].classList.remove('selected');
          }
        }
      }
    },
    mounted() {
      this.getSelection();
      onmessage = (event) => {
        if (event.data.pluginMessage.type === "selection") {
          this.selection = event.data.pluginMessage.selection;
          this.getColors();
        }
        if (event.data.pluginMessage.type === "colors") {
          this.colors = event.data.pluginMessage.colors;
        }
      };

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutationRecord) => {
          this.inputHexChange();
        })
      });
      let targets = document.querySelectorAll('.range-slider');
      for (let i = 0; i < targets.length; i++) {
        observer.observe(targets[i], { attributes : true, attributeFilter : ['style'] });
      }
    }
  };
</script>

<style>
  body,input,select,textarea{background:0;border-radius:0;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-size:13px;margin:0;padding:0}input::selection{background:#989898}body{background-color:#222}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}div.demo div{color:#fff;height:2em;line-height:2em;padding-left:.3em;padding-right:.3em}#display{position:relative;width:400px;height:400px}#picker{width:400px; position: absolute; top: 0; left: 0;}#picker td.cell-input{width:68px;padding-right:4px}#picker td.cell-input input{margin:0;height:24px;background:0 0;color:#b7b7b7;outline:0;border:1px solid #333;border-radius:0;text-align:right;width:100%;padding:0 5px}#picker td.cell-input.cell-input-hex input{font-family:monospace;border-color:#333;height:40px}#picker table{width:96%;margin:0 2%}#picker table td{padding:2px 2px;vertical-align:top;border:none}#picker table td.picker-label{color:#b7b7b7;width:1px;line-height:24px;user-select:none}#picker table .swatch{height:40px;cursor:pointer;box-sizing:border-box}#picker table .swatch:active{border:1px solid #fff;transition:.02s}.range-slider{height:24px;display:block;position:relative}.range-slider-handle{display:inline-block;position:absolute;width:6px;top:-2px;left:-5px;height:100%;cursor:default;border:2px solid #fff;touch-action:pan-y;-ms-touch-action:pan-y}

  #picker {
    width: 320px;
    height: 320px;
  }

  #picker > table {
    position: absolute;
    top: 316px;
  }

  #display{
    transform: scale(0.72);
    transform-origin: left top;
    top: 16px;
    left: 16px;
  }

  #picker td.cell-input input {
    height: 20px;
    line-height: 20px;
    padding: 0 4px;
  }

  .range-slider {
    height: 20px;
  }

  body {
    text-align: left;
    overflow: hidden;
    position: relative;
  }
  * {
    font-family: Inter, sans-serif !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-size: 12px;
    line-height: 16px;
  }
  .input-hex {
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  #reload {
    position: absolute;
    cursor: pointer;
    right: 0px;
    bottom: 0px;
    box-sizing: border-box;
    width: 116px;
    height: 24px;
    background: #cecece;
    border: 1px solid transparent;
    color: #222;
    font-weight: 600;
    line-height: 24px;
    text-align: center;
  }
  #reload:active {
    border-color: #36A0FB;
  }

  #colorList {
    position: absolute;
    width: 116px;
    right: 0;
    height: 448px;
    overflow-y: scroll;
    overflow-x: hidden;
    background-color: #2C2C2C;
    z-index: 999;
    box-sizing: border-box;
  }

  .colorGroup {
    box-sizing: border-box;
    border-bottom: 1px solid #222;
    padding: 8px 0px;
  }

  .colorGroup.h > .cat {
    opacity: .4 !important;
  }

  .cat {
    font-weight: 600;
    color: #ffffff;
    height: 12px;
    line-height: 12px;
    user-select: none;
    padding: 8px 12px;
    padding-right: 10px;
  }

  .fill {
    color: #b7b7b7;
    padding: 4px 12px;
    overflow: hidden;
    position: relative;
  }

  .type {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-direction: row;
      height: 14px;
      line-height: 16px;
      user-select: none;
      color: white;
  }
  .colors {
    margin-top: 4px;
  }
  .color {
    display: flex;
    align-items: center;
    justify-content: left;
    flex-direction: row;
    height: 16px;
    margin-top: 2px;
    padding: 2px 2px;
    position:relative;
    border: transparent 1px solid;
    margin-left: -4px;
    margin-right: -2px;
    cursor: pointer;
  }
  .color.selected {
    background-color: #222;
    border: 1px solid #36A0FB;
  }
  .color > .icon {
    width: 16px;
    height: 16px;
    border: 1px solid #222;
    box-sizing: border-box;
    cursor: pointer;
    user-select: none;
  }
  .color > .hex {
    height: 16px;
    line-height: 16px;
    padding-left: 6px;
    margin-right: 4px;
    cursor: pointer;
    user-select: none;
    letter-spacing: 0.4px;
  }
</style>