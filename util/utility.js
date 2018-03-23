module.exports = function() {
    String.prototype.formatKey = function () {
        let str = this.toString();

        if(arguments.length) {
            let t = typeof arguments[0];
            let key;
            let args = ("string" === t || "number" === t) ? Array.prototype.slice.call(arguments) : arguments[0];

            for(key in args) {
                str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
            }
        }

        return str;
    };

    if(!String.prototype.format) {
        String.prototype.format = function() {
            let args = arguments;

            return this.replace(/{(\d+)}/g, function(match, number) { 
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        };
    }
}