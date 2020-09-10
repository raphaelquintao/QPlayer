define(['THREE'], function (THREE) {
    
    
    function disc(outerRadius, innerRadius, outerWidth, innerWidth, segments, phiStart, phiLength, closedStart, closedEnd) {
        segments = (typeof segments === 'number') ? segments : 256;
        phiStart = ( phiStart !== undefined ) ? phiStart : 0;
        phiLength = ( phiLength !== undefined ) ? phiLength : Math.PI * 2;
        closedStart = (typeof closedStart === 'boolean') ? closedStart : false;
        closedEnd = (typeof closedEnd === 'boolean') ? closedEnd : false;
        
        var oWidth = outerWidth / 2;
        var iWidth = innerWidth / 2;
    
        var widthSegments = 0;
        
        var points = [];
        // for (var i = 0; i < 10; i++) {
        //     points.push(new THREE.Vector2(Math.sin(i * 0.2) * 10 + 5, ( i - 5 ) * 2));
        // }
        
        points.push(new THREE.Vector2(outerRadius, -oWidth));
        points.push(new THREE.Vector2(outerRadius, oWidth));
        points.push(new THREE.Vector2(innerRadius, iWidth));
        points.push(new THREE.Vector2(innerRadius, -iWidth));
        points.push(new THREE.Vector2(outerRadius, -oWidth));
        
        var geometry = new THREE.LatheGeometry(points, segments, -Math.PI / 2 + phiStart, phiLength);
        geometry.rotateX(90 * Math.PI / 180);
        // geometry.mergeVertices();
        
        if (closedStart && closedEnd) {
            
            var capWidth = outerRadius - innerRadius;
            
            var capStart = new THREE.PlaneGeometry(outerRadius - innerRadius, outerWidth);
            capStart.rotateX(-Math.PI / 2);
            capStart.translate(-outerRadius + capWidth / 2, 0, 0);
            
            geometry.rotateZ(-phiStart);
            capStart.merge(geometry);
            capStart.rotateZ(phiStart);
            
            
            var capEnd = new THREE.PlaneGeometry(outerRadius - innerRadius, outerWidth);
            capEnd.rotateX(Math.PI / 2);
            capEnd.translate(-outerRadius + capWidth / 2, 0, 0);
            
            capStart.rotateZ(-(phiStart + phiLength));
            capStart.merge(capEnd);
            capStart.rotateZ((phiStart + phiLength));
            
            return capStart;
        }
        
        return geometry;
    }
    
    function torusAdv(radius, tubeDiam, rSeg, tSeg, arc, thetaStart, thetaLength, closedStart, closedEnd) {
        arc = (typeof arc === 'number') ? arc : 2 * Math.PI;
        thetaStart = (typeof thetaStart === 'number') ? thetaStart : 0;
        thetaLength = (typeof thetaLength === 'number') ? thetaLength : 2 * Math.PI;
        closedStart = (typeof closedStart === 'boolean') ? closedStart : false;
        closedEnd = (typeof closedEnd === 'boolean') ? closedEnd : false;

        
        var points = [];
        
        var step = 2 * Math.PI / rSeg;
        
        var x = 0, y = 0;
        
        for (var j = 0; j <= thetaLength; j += step) {
            x = tubeDiam * Math.cos(-Math.PI + thetaStart + j);
            y = tubeDiam * Math.sin(-Math.PI + thetaStart + j);
            
            x += radius;
            
            points.push(new THREE.Vector2(x, y));
        }
        
        var geometry = new THREE.LatheGeometry(points, tSeg, -Math.PI / 2, arc);
        geometry.rotateX(Math.PI / 2);
        // geometry.translate(0, 0, -radius);
        
        
        return geometry;
    }
    
    function tubeRounded(radius, width, height, cSeg, tSeg, arc, cornerRadius) {
        arc = (typeof arc === 'number') ? arc : 2 * Math.PI;
        thetaStart = (typeof thetaStart === 'number') ? thetaStart : 0;
        thetaLength = (typeof thetaLength === 'number') ? thetaLength : 2 * Math.PI;
        
        var cR = {TopL: 0, TopR: 0, BotR: 0, BotL: 0};
        
        
        if (typeof cornerRadius === 'number') {
            cR.TopL = cR.TopR = cR.BotR = cR.BotL = cornerRadius;
        } else if (typeof cornerRadius !== 'undefined') {
            for (var side in cR) cR[side] = cornerRadius[side] || cR[side];
        }
        
        
        
        var points = [];
        
        function drawCorner(cX, cY, cR, seg, tStart, tLength) {
            if(tLength === undefined) tLength = Math.PI / 2;
            var step = tLength / seg;
            
            var x = 0, y = 0;
            
            for (var j = 0; j <= tLength; j += step) {
                x = cX + cR * Math.cos(tStart + j);
                y = cY + cR * Math.sin(tStart + j);
                
                points.push(new THREE.Vector2(x, y));
            }
        }
        
        
        drawCorner(radius - width + cR.BotL, -height + cR.BotL, cR.BotL, cSeg, Math.PI);
        
        drawCorner(radius + width - cR.BotR, -height + cR.BotR, cR.BotR, cSeg, Math.PI * 1.5);
        
        drawCorner(radius + width - cR.TopR, height - cR.TopR, cR.TopR, cSeg, Math.PI * 2);
        
        drawCorner(radius - width + cR.TopL, height - cR.TopL, cR.TopL, cSeg, Math.PI * 2.5);
        
        points.push(points[0]);
        
        
        var geometry = new THREE.LatheGeometry(points, tSeg, Math.PI / 2, arc);
        geometry.rotateX(Math.PI / 2);
        
        return geometry;
    }
    
    
    return {
        disc: disc,
        torusAdv: torusAdv,
        tubeRounded: tubeRounded
    }
    
});