define(['THREE'], function (THREE) {

    function CurveEllipse(aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation, percent) {
        THREE.Curve.call(this);
        this.percent = ( percent === undefined ) ? 1 : percent;

        this.aX = aX;
        this.aY = aY;

        this.xRadius = xRadius;
        this.yRadius = yRadius;

        this.aStartAngle = aStartAngle;
        this.aEndAngle = aEndAngle;

        this.aClockwise = aClockwise;

        this.aRotation = aRotation || 0;

        this.isEllipseCurve = true;
    }

    CurveEllipse.prototype = Object.assign(Object.create(THREE.Curve.prototype), {
        constructor: CurveEllipse,
        getPoint: function (t) { //getPoint: t is between 0-1
            t = t * this.percent;

            var twoPi = Math.PI * 2;
            var deltaAngle = this.aEndAngle - this.aStartAngle;
            var samePoints = Math.abs(deltaAngle) < Number.EPSILON;

            // ensures that deltaAngle is 0 .. 2 PI
            while (deltaAngle < 0) deltaAngle += twoPi;
            while (deltaAngle > twoPi) deltaAngle -= twoPi;

            if (deltaAngle < Number.EPSILON) {
                if (samePoints) {
                    deltaAngle = 0;
                } else {
                    deltaAngle = twoPi;
                }

            }

            if (this.aClockwise === true && !samePoints) {
                if (deltaAngle === twoPi) {
                    deltaAngle = -twoPi;
                } else {
                    deltaAngle = deltaAngle - twoPi;
                }
            }

            var angle = this.aStartAngle + t * deltaAngle;
            var x = this.aX + this.xRadius * Math.cos(angle);
            var y = this.aY + this.yRadius * Math.sin(angle);

            if (this.aRotation !== 0) {
                var cos = Math.cos(this.aRotation);
                var sin = Math.sin(this.aRotation);

                var tx = x - this.aX;
                var ty = y - this.aY;

                // Rotate the point about the center of the ellipse.
                x = tx * cos - ty * sin + this.aX;
                y = tx * sin + ty * cos + this.aY;

            }

            return new THREE.Vector3(x, y, 0);
        }
    });

    function Circle(scale, percent) { //custom curve constructor
        THREE.Curve.call(this);
        this.scale = ( scale === undefined ) ? 1 : scale;
        this.percent = ( percent === undefined ) ? 1 : percent;
    }

    Circle.prototype = Object.assign(Object.create(THREE.Curve.prototype), {
        constructor: Circle,
        getPoint: function (t) { //getPoint: t is between 0-1
            var radius = 1;
            var rot = 90 * Math.PI / 180;

            var tStart = Math.PI;
            var tEnd = (2 * Math.PI) * (t * this.percent);
            if (tEnd >= 2 * Math.PI) {
                tEnd = 0;
            }

            var tx = Math.cos(tStart + tEnd);
            var ty = Math.sin(tStart + tEnd);
            var tz = 0;

            return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale);
        }
    });

    function SemiCircle(scale, percent, offDeg, inverseY) {
        THREE.Curve.call(this);

        this.scale = ( scale === undefined ) ? 1 : scale;
        this.offDeg = ( offDeg !== undefined ) ? offDeg : 0;
        this.inverseY = ( inverseY !== undefined ) ? inverseY : true;
        this.percent = ( percent === undefined ) ? 1 : percent;
    }

    SemiCircle.prototype = Object.assign(Object.create(THREE.Curve.prototype), {
        constructor: SemiCircle,
        getPoint: function (t) { //getPoint: t is between 0-1
            var offRad = (this.offDeg * Math.PI / 180);

            var tStart = offRad;
            var tEnd = (Math.PI - offRad * 2) * (t - (1 - this.percent));

            var tx = Math.cos(tStart + tEnd) * (-1);
            var ty = Math.sin(tStart + tEnd);
            if (this.inverseY) ty *= -1;

            return new THREE.Vector3(tx, ty, 0).multiplyScalar(this.scale);
        }
    });


    return {
        CurveEllipse: CurveEllipse,
        Ellipse: CurveEllipse,
        Circle: Circle,
        SemiCircle: SemiCircle
    }

});