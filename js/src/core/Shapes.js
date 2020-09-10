define(['THREE'], function (THREE) {
    
    
    function circle(radius, precision) {
        precision = (typeof precision === 'number') ? precision : 64;
        var step = 2 * Math.PI / precision;
        
        var Shape = new THREE.Shape();
        
        var x = 0;
        var y = 0;
        
        for (var i = 0; i < 2 * Math.PI; i += step) {
            x = radius * Math.cos(i);
            y = radius * Math.sin(i);
            
            if (i == 0) Shape.moveTo(x, y);
            else Shape.lineTo(x, y);
        }
        
        return Shape;
    }
    
    function rectangle(width, height) {
        var shape = new THREE.Shape();
        shape.moveTo(-width / 2, height / 2);
        shape.lineTo(width / 2, height / 2);
        shape.lineTo(width / 2, -height / 2);
        shape.lineTo(-width / 2, -height / 2);
        shape.lineTo(-width / 2, height / 2);
        return shape;
    }
    
    function rectangleRounded(width, height, cornerRadius) {
        if (typeof cornerRadius === 'undefined') {
            cornerRadius = 5;
        }
        if (typeof cornerRadius === 'number') {
            cornerRadius = {tl: cornerRadius, tr: cornerRadius, br: cornerRadius, bl: cornerRadius};
        } else {
            var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (var side in defaultRadius) {
                cornerRadius[side] = cornerRadius[side] || defaultRadius[side];
            }
        }
        
        var shape = new THREE.Shape();
        
        var x = -width / 2;
        var y = -height / 2;
        
        shape.moveTo(x + cornerRadius.tl, y);
        shape.lineTo(x + width - cornerRadius.tr, y);
        shape.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.tr);
        shape.lineTo(x + width, y + height - cornerRadius.br);
        shape.quadraticCurveTo(x + width, y + height, x + width - cornerRadius.br, y + height);
        shape.lineTo(x + cornerRadius.bl, y + height);
        shape.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.bl);
        shape.lineTo(x, y + cornerRadius.tl);
        shape.quadraticCurveTo(x, y, x + cornerRadius.tl, y);
        shape.lineTo(x + cornerRadius.tl, y);
        
        return shape;
    }
    
    
    return {
        circle: circle,
        rectangle: rectangle,
        rectangleRounded: rectangleRounded
    }
});