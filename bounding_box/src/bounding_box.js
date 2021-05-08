import React from 'react';
import Canvas from './Canvas.js';


class BoundingBox extends React.Component {

    constructor (props) {
        super(props);
        this.height = props.height ? props.height : 800;
        this.width = props.width ? props.width: 800;
        this.draw = this.draw.bind(this);
        this.drawCircles = this.drawCircles.bind(this);
        this.inited = false;

        this.circlePositions = [];
        this.generateData(10);        
    }

    drawCircle(ctx, x, y, radius, color) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    generateData(n) {
        let margin = 0.3;
        let widthMarginOffset = margin * this.width;
        let heightMarginOffset = margin * this.height;
        
        for (let i = 0; i < n; i++) {
            let x = Math.random() * this.width * (1 - 2 * margin) + widthMarginOffset;
            let y = Math.random() * this.height * (1 - 2 * margin) + heightMarginOffset;
            this.circlePositions.push([x, y]);
        }

        let x_sum = 0;
        let y_sum = 0;
        for (let [x, y] of this.circlePositions) {
            x_sum += x;
            y_sum += y;
        }
        x_mean = x_sum / this.circlePositions.length;
        y_mean = y_sum / this.circlePositions.length;
    }
    
    drawCircles(ctx, n) {  
        ctx.clearRect(0, 0, this.width, this.height);
        for (let [x, y] of this.circlePositions) {
            this.drawCircle(ctx, x, y, 5, 'red');
        }
    }
    
    draw(ctx, frameCnt) {
        this.drawCircles(ctx, 10);
    }
    
    render () {
        return <Canvas draw={this.draw} height={this.height} width={this.width}/>;
    }
}

export default BoundingBox;
