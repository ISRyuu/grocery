//  References:
//  https://www.youtube.com/watch?v=BV9ny785UNc&list=RDCMUCvjgXvBlbQiydffZU7m1_aw&start_radio=1&t=1542s
//  https://www.karlsims.com/rd.html

import logo from './logo.svg';
import './App.css';
import Canvas from './Canvas';
import React from 'react';


class ReactionDiffusion extends React.Component {
  constructor(props) {
    super(props);
    this.init();
    this.draw = this.draw.bind(this);
  }

  init() {
    let {width, height} = this.props;
    this.width = width ? width : 400;
    this.height = height ? height : 400;

    this.draw = this.draw.bind(this);
    this.imgdata = null;
    this.currentGenerationData = [];
    this.nextGenerationData = [];
    this.da = this.props.dA;
    this.db = this.props.dB;
    this.f = this.props.feed;
    this.k = this.props.kill;
    this.initBs = this.props.initBs;
    this.laplacianWeights = [
      0.05, 0.2, 0.05,
      0.2, -1, 0.2,
      0.05, 0.2, 0.05
    ];
    this.initGeneration();
  }

  initGeneration() {
    for (let i = 0; i < this.height * this.width; i++) {
      this.currentGenerationData[i] = {a: 1, b: 0};
      this.nextGenerationData[i] = {a: 1, b: 0};
    }

    for (let c = 0; c < this.props.initBs; c++) {
      let rowCenter = Math.floor(((Math.random() * 0.8) + 0.1) * this.height);
      let colCenter = Math.floor(((Math.random() * 0.8) + 0.1) * this.width);
      for (let i = rowCenter; i <= rowCenter+10; i++) {
        for (let j = colCenter; j <= colCenter+10; j++ ) {
          this.currentGenerationData[i*this.width+j].b = 1;
        }
      }
    }
  }
  
  applyReactionToImage() {
    if (!this.imgdata) return;
    let imgdata = this.imgdata;
    let reactionData = this.nextGenerationData;
    let indexOffset = 0;
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        let {a, b} = reactionData[indexOffset / 4];
        let diff = a - b;
        let color = Math.max(0, Math.min(255, diff * 255));

        imgdata.data[indexOffset] = color;     // R
        imgdata.data[indexOffset + 1] = color; // G
        imgdata.data[indexOffset + 2] = color; // B
        imgdata.data[indexOffset + 3] = 255;   // A
        indexOffset += 4;
      }
    }
  }

  calcLaplacian(pixelIndex, key) {
    let weightIndex = 0;
    let res = 0;
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        let pixelData = this.currentGenerationData[pixelIndex + (rowOffset * this.width) + (colOffset)];
        res += (this.laplacianWeights[weightIndex] * pixelData[key]);
        weightIndex += 1;
      }
    }
    return res;
  }

  componentDidUpdate() {
    this.init();
  }

  nextGeneration() {
     for (let i = 0; i < this.currentGenerationData.length; i++) {
      let row = Math.floor(i / this.width);
      let col = i % this.width;
      if (row === 0 || row === (this.height-1) || col === 0 || col === (this.width-1)) {
        // edges
        continue;
      }
      let {a: nextA, b: nextB} = this.currentGenerationData[i];

      nextA = nextA + this.da * this.calcLaplacian(i, 'a') - nextA*nextB*nextB + this.f*(1 - nextA);
      nextB = nextB + this.db * this.calcLaplacian(i, 'b') + nextA*nextB*nextB - (this.k+this.f)*nextB;
      nextA = Math.min(Math.max(0, nextA), 1);
      nextB = Math.min(Math.max(0, nextB), 1);

      this.nextGenerationData[i].a = nextA;
      this.nextGenerationData[i].b = nextB;
    }
  }

  swapGeneration() {
    this.currentGenerationData = this.nextGenerationData;
  }

  draw(ctx, frameCount) {    
    if (!this.imgdata) {
      ctx.clearRect(0, 0, this.width, this.height);
      this.imgdata = ctx.getImageData(0, 0, this.width, this.height);
      return;      
    }
    this.nextGeneration();
    this.applyReactionToImage();
    this.swapGeneration();
      
    ctx.putImageData(this.imgdata, 0, 0);
  }

  render() {    
    return (
      <React.Fragment>
        <Canvas draw={this.draw} width={this.props.width} height={this.props.height} />
      </React.Fragment>); 
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 400,
      height: 400,
      dA: 1,
      dB: 0.5,
      feed: 0.055,
      kill: 0.062,
      initBs: 1
    };

    this.percentDivisor = 1000;

    this.onChangeField = this.onChangeField.bind(this);
  }

  onChangeField(event, field) {
    if (field === 'initBs') {
      this.setState({[field]: event.target.value});
    } else {
      this.setState({[field]: event.target.value / this.percentDivisor});
    }
  }

  render() {
    return (
      <React.Fragment>
        <h1><a href={"https://www.karlsims.com/rd.html"}>Reaction-Diffusion</a></h1>
        <div>
          <ReactionDiffusion width={this.state.width} height={this.state.height} img={this.state.file}
            feed={this.state.feed} kill={this.state.kill} dA={this.state.dA} dB={this.state.dB} initBs={this.state.initBs}/>
        </div>
        kill: <input type='range' min={0} max={this.percentDivisor} value={this.state.kill * this.percentDivisor} onChange={(event) => this.onChangeField(event, 'kill')}/> {this.state.kill} <br />
        feed: <input type='range' min={0} max={this.percentDivisor} value={this.state.feed * this.percentDivisor} onChange={(event) => this.onChangeField(event, 'feed')}/> {this.state.feed} <br />
        dA: <input type='range' min={0} max={this.percentDivisor} value={this.state.dA * this.percentDivisor} onChange={(event) => this.onChangeField(event, 'dA')}/> {this.state.dA} <br />
        dB: <input type='range' min={0} max={this.percentDivisor} value={this.state.dB * this.percentDivisor} onChange={(event) => this.onChangeField(event, 'dB')}/> {this.state.dB} <br />
        initial B clusters: <input type='range' min={1} max={10} value={this.state.initBs} onChange={(event) => this.onChangeField(event, 'initBs')}/> {this.state.initBs} <br />
      </React.Fragment>
    );
  }

}

export default App;