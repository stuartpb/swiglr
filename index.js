var fs = require('fs')
var gm = require('gm')
var jade = require('jade')

//CONFIGURE. Yes, it's clunky. Sorry.
var srcdir = './srcimgs'
var destdir = './destsite'
var tsize = 150
var galtitle = 'Photos!'
var pagerows = 4
var pagecols = 7

//RUN.

function copyFile(src,dest) {
  fs.createReadStream(src).pipe(fs.createWriteStream(dest));
}
function cpDirToDir(name,src,dest){
  copyFile(src + '/' + name, dest + '/' + name)
}

function mkdirIfNotPresent(path) {
  if(!fs.statSync(path).isDirectory()){
    fs.mkdirSync(path)
  }
}

var files = fs.readdirSync(srcdir)
var pageCount = Math.ceil(files.length / (pagerows * pagecols))
var rowCount = Math.ceil(files.length / pagecols)
var jt = jade.compile(
  fs.readFileSync(__dirname+'/galpage.jade'),
  {pretty: true})

mkdirIfNotPresent(destdir)

for (var i = 0; i < pageCount; ++i) {
  //Construct rows
  var rows = []
  var startingRow = pagerows * i
  var startingImg = pagecols * startingRow
  for(var iRow = 0; iRow < pagerows && startingRow + iRow < rowCount; ++iRow) {
    rows[iRow] = []
    for(var iCol = 0; iCol < pagecols && startingImg + iRow * pagecols + iCol < files.length; ++iCol) {
      var iImg = startingImg + iRow * pagecols + iCol
      rows[iRow][iCol] = {
        dest: files[iImg],
        thumb: 'thumbs/'+(iImg+1)+'.jpg'
      }
    }
  }
  var filename = destdir + '/'
  if (i == 0)
    filename += 'index.html'
  else
    filename += 'page' + (i+1) + '.html'

  fs.writeFileSync(filename, jt({
    pagetitle: galtitle + ' - Page ' + (i+1) + ' of ' + pageCount,
    rows: rows,
    pagenum: i,
    totalpages: pageCount
    }))
}

//Generate thumbnails

mkdirIfNotPresent(destdir+'/thumbs')

function reportThumbing(orig, thumb) {
  return function (err) {
    if (!err) {
      console.log(orig + ' => ' + thumb)
    } else {
      console.error(err)
    }
  }
}

for(var i = 0; i < files.length; ++i) {
  var destFilename = '/thumbs/' + (i+1) + '.jpg'
  gm(srcdir + '/' + files[i])
    //TODO: Get size and crop for the middle
    .resize(tsize,tsize)
    .write(destdir + destFilename, reportThumbing(
      files[i], destFilename))
}

//Copy static resources
cpDirToDir('galstyle.css',__dirname,destdir)
