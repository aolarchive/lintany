var fs = require('fs'), util = require('util'), growl = require('growl'), jshint = require('jshint');

var failed = false, filepath = process.cwd()+'/'+process.argv.slice(2), linters = [], lintersFileFilter = [], config = {};

util.print('Current directory: ' + process.cwd());
eval(fs.readFileSync(__dirname+'/config.js', encoding="ascii"));

for (var i = 0; i < config.linters.length; i++){
	var curlinter = config.linters[i], lintername = curlinter.name, linterFFilter = curlinter.fileFilter;
	linters.push(require(lintername.toLowerCase())[lintername.toUpperCase()]);
	lintersFileFilter.push(linterFFilter);
}

function walk(filepath, callback) {
	//util.print(filepath);
    fs.stat(filepath, function(err, stats) {
		if (err) throw err;
        if (stats.isFile() && filepath.match(lintersFileFilter[0])) {
            monitorFile(filepath);
        } else if (stats.isDirectory()) {
            fs.readdir(filepath, function(err, files) {
                for (var i = 0; i < files.length; i++) {
                    walk(filepath + '/' + files[i], callback);
                }
            });
        }
    });
}

function monitorFile(filename) {
    //util.print("\nmonitoring "+filename+"\n");
    fs.watchFile(filename, function(oc, nc) {
        //util.print(nc.mtime.getTime() +'|'+ oc.mtime.getTime());
        if (nc.mtime.getTime() !== oc.mtime.getTime()) {
            var src = fs.readFileSync(filename, "utf-8");
            util.print('checking '+filename+' for errors.\n');
            var curlinter = linters[0], success = curlinter(src), errmsg, errs, errlen, lasterrlen = 0;
			errs = curlinter.errors;
            errlen = errs.length;
			//util.print(!success +':'+ !failed +':'+ lasterrlen +':'+ errlen+'\n');
            if (!success && (!failed || lasterrlen >= errlen)) {
                errmsg = '';
                title = '"' + filename.replace(/.*\//, "").replace(/\.js/,"") + '" has problems\n';
                for (var i = 0; i < errlen; i++) {
                    var rawmsg = (curlinter.errors[i]) ? curlinter.errors[i].reason : "Unknown error", line = (curlinter.errors[i]) ? curlinter.errors[i].line + ':' + curlinter.errors[i].character : "X:X";
                    errmsg = errmsg + line + ' - ' + rawmsg;
					if (errlen -1 !== i){
						errmsg = errmsg + "\n\n";
					}
                }
                growl.notify(errmsg, {
                    title: title,
                    image: __dirname+'/no.png'
                });
                failed = true;
				lasterrlen = errlen;
            } else {
				if (!failed) {
					errmsg = 'Nice work!';
					title = '"' + filename.replace(/.*\//, "").replace(/\.js/,"") + '" passed\n';
					growl.notify(errmsg, {
						title: title,
						image: __dirname+'/yes.png'
					});
					failed = false;
				}
            }
            
        } else {
            failed = false;
        }
    });
}

walk(filepath);
