'use babel';

export default class KeyBindView {

  constructor() {
    this.kName = 'pseudo-synthesizer'
    this.kHeight = 256;

    this.element = document.createElement('div');
    this.element.classList.add(this.kName);

    this.canvasFrequency = document.createElement('canvas');
    this.canvasFrequency.classList.add(this.kName, 'frequency');
    this.canvasFrequency.height = this.kHeight;
    this.canvasDomain = document.createElement('canvas');
    this.canvasDomain.classList.add(this.kName, 'domain');
    this.canvasDomain.height = this.kHeight;
  }

  destroy() {
    this.element.remove();
  }

  serialize() {
  }

  getElement() {
    return this.element;
  }
  getTitle() {
    return 'Analyser';
  }
  getURI() {
    return 'pseudo-synthesizer://Analyser';
  }

  setCanvus(size){
    this.canvasFrequency.width = size / 2;
    this.element.appendChild(this.canvasFrequency);
    this.canvasDomain.width = size;
    this.element.appendChild(this.canvasDomain);
  }

  draw(byteDatas, type) {
    return () => {
    //余裕が出来たら 反転の処理
      let context = null, width = 0, height = 0;
      if(type === 'frequency') {
        width = this.canvasFrequency.width = byteDatas.length;
        context = this.canvasFrequency.getContext('2d');
        height = this.canvasFrequency.height;
      } else {
        width = this.canvasDomain.width = byteDatas.length;
        context = this.canvasDomain.getContext('2d');
        height = this.canvasDomain.height;
      }
      context.fillStyle = 'hsla(0, 0%, 100%, 1)';
      context.strokeStyle = 'hsla(0, 0%, 0%, 1)';
      context.lineWidth = 5.0;
      context.lineJoin = 'bevel';
      context.clearRect(0, 0, width, height);
      context.beginPath();
      context.moveTo(0, 0);
      for(let i = 0; i < byteDatas.length; ++i) {
        if(i !== 0) {
          context.lineTo(i, byteDatas[i]);
        } else {
          context.moveTo(i, byteDatas[i]);
        }
      }
      context.stroke();
    };
  }
}

function drowLine(context, sx, sy, ex, ey) {
  context.moveTo(sx, sy);
  context.lineTo(ex, ey);
}
