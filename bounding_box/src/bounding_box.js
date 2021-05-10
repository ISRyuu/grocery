import React from 'react';
import Canvas from './Canvas.js';
import Matrix, { EigenvalueDecomposition } from 'ml-matrix';

class BoundingBox extends React.Component {

    constructor (props) {
        super(props);
        this.height = props.height ? props.height : 800;
        this.width = props.width ? props.width: 800;
        this.draw = this.draw.bind(this);
        this.drawCircles = this.drawCircles.bind(this);

        this.circlePositions = [];
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
        this.circlePositions = [];        
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
        let x_mean = x_sum / this.circlePositions.length;
        let y_mean = y_sum / this.circlePositions.length;

        let dataMatrix = new Matrix(this.circlePositions).transpose();
        let meanMatrix = new Matrix(Array.from({length: n}).map(x => [x_mean, y_mean])).transpose();

        let meanDeviationData = dataMatrix.sub(meanMatrix);
        let covarianceMatrix = meanDeviationData.mmul(meanDeviationData.transpose()).mul(1 / (n - 1));
        // console.log(meanDeviationData, covarianceMatrix);
        this.pcaEigDecompRes = new EigenvalueDecomposition(covarianceMatrix);
        //console.log(this.pcaEigDecompRes);

        let eigVectors = this.pcaEigDecompRes.eigenvectorMatrix.transpose().to2DArray();
        let eigValues = this.pcaEigDecompRes.realEigenvalues;

        let eigTuples = eigVectors.map((v, i) => [eigValues[i], v]);
        eigTuples.sort((a, b) => b[0] - a[0]);
        this.eigTuples = eigTuples;
        let eigVectorP = eigTuples[0][1]; // principle
        let eigVectorS = eigTuples[1][1];  // second

        let minP = Number.POSITIVE_INFINITY;
        let maxP = Number.NEGATIVE_INFINITY;
        let minS = Number.POSITIVE_INFINITY;
        let maxS = Number.NEGATIVE_INFINITY;
        
        for (let point of meanDeviationData.transpose().to2DArray()) {
            let proj = point[0] * eigVectorP[0] + point[1] * eigVectorP[1];
            minP = Math.min(proj, minP);
            maxP = Math.max(proj, maxP);

            proj = point[0] * eigVectorS[0] + point[1] * eigVectorS[1];
            minS = Math.min(proj, minS);
            maxS = Math.max(proj, maxS);
        }

        // notice that the order matters for drawing
        let p1 = [eigVectorP[0] * maxP + eigVectorS[0] * maxS + x_mean , eigVectorP[1] * maxP + eigVectorS[1] * maxS + y_mean];
        let p2 = [eigVectorP[0] * maxP + eigVectorS[0] * minS + x_mean, eigVectorP[1] * maxP + eigVectorS[1] * minS + y_mean];        
        let p3 = [eigVectorP[0] * minP + eigVectorS[0] * minS + x_mean, eigVectorP[1] * minP + eigVectorS[1] * minS + y_mean];
        let p4 = [eigVectorP[0] * minP + eigVectorS[0] * maxS + x_mean, eigVectorP[1] * minP + eigVectorS[1] * maxS + y_mean];

        this.boundingBoxVertices = [p1, p2, p3, p4];
            
        console.log(p1, p2, p3, p4);
    }
    
    drawCircles(ctx) {  
        ctx.clearRect(0, 0, this.width, this.height);
        for (let [x, y] of this.circlePositions) {
            this.drawCircle(ctx, x, y, 5, 'blue');
        }       
    }
    
    drawBoundingBox(ctx) {
        ctx.beginPath();        
        ctx.moveTo(...this.boundingBoxVertices[0]);        
        for (let p of this.boundingBoxVertices.slice(1)) {
            ctx.lineTo(...p);
        }
        ctx.lineTo(...this.boundingBoxVertices[0]);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    draw(ctx, frameCnt) {
        this.drawCircles(ctx);
        this.drawBoundingBox(ctx);
    }
    
    render () {
        this.generateData(13);
        return (
            <React.Fragment>
            <Canvas draw={this.draw} height={this.height} width={this.width}/>            
            <h3>Bounding Box (by PCA)</h3>            
            <p>{this.eigTuples[0][0]}: [{this.eigTuples[0][1].join(', ')}]</p>
            <p>{this.eigTuples[1][0]}: [{this.eigTuples[1][1].join(', ')}]</p>            
            </React.Fragment>
        );
    }
}

export default BoundingBox;
