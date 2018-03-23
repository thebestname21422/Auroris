var md5 = require('md5');

module.exports = {
    random_key: function(length) {
        var keys = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$.+-_$';
        var result = [];
        
        for(var i = 0; i < length; i++) {
            var num = Math.floor(Math.random() * keys.length);
            result[i] = keys.substring(num, num + 1);
        }
        
        return result.join('');
    },
        
    swap_md5: function(string) {
        return string.substr(16, 16) + string.substr(0, 16);
    },
    
    encrypt_password: function(password, key) {
        return this.swap_md5(md5(this.swap_md5(password) + key + 'Y(02.>\'H}t":E1'));
    },
    
    world_key: function(password) {
        return this.swap_md5(md5(password));
    },
    
    login_key: function(key) {
        return md5(key.split('').reverse().join(''));
    }
}