define(function () {
    
    return {
        
        
        /**
         * No easing, no acceleration
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        linear: function (t) { return t; },
        
        /**
         * Acceleration from zero velocity
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeInQuad: function (t) { return t * t; },
        
        /**
         * Decelerating to zero velocity
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeOutQuad: function (t) { return t * (2 - t); },
        
        /**
         * Acceleration until halfway, then deceleration
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeInOutQuad: function (t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
        
        /**
         * Acceleration from zero velocity
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeInCubic: function (t) { return t * t * t; },
        
        /**
         * Decelerating to zero velocity
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeOutCubic: function (t) { return (--t) * t * t + 1; },
        
        /**
         * Acceleration from zero velocity
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeInOutCubic: function (t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; },
        
        /**
         * Acceleration from zero velocity
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeInQuart: function (t) { return t * t * t * t; },
        
        /**
         * Decelerating to zero velocity
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeOutQuart: function (t) { return 1 - (--t) * t * t * t; },
        
        /**
         * Acceleration from zero velocity
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeInOutQuart: function (t) { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t; },
        
        /**
         * Acceleration from zero velocity
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeInQuint: function (t) { return t * t * t * t * t; },
        
        /**
         * Decelerating to zero velocity
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeOutQuint: function (t) { return 1 + (--t) * t * t * t * t; },
        
        /**
         * Acceleration from zero velocity
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeInOutQuint: function (t) { return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t; },
    
        /**
         * Bounce effect
         * @param {number} t - Time from the range [0, 1]
         * @return {number}
         */
        easeOutElastic: function (t) {
            var p = 0.3;
            return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
        }
    };
    
});