var fs = require('fs')
var gm = require('gm')

//CONFIGURE. Yes, it's clunky. Sorry.
var srcdir = './srcimgs'
var destdir = './destsite'
var tsize = 150
var galtitle = 'Photos!'
var pagerows = 4
var pagecols = 7

//RUN.

var files = readdirSync(srcdir)
var pageCount = Math.ceil(files.length/(pagerows*pagecols))
var rowCount = Math.ceil(files.length/pagerows)
var jt = jade.compile(fs.readFileSync('./galpage.jade'),{pretty: true})

for (var i = 0; i<pageCount; ++i) {
  //Construct rows
  var rows = []
  var startingRow = pagerows * i
  var startingImg = pagecols * startingRow
  for(var iRow=0; iRow < pagerows && startingRow + iRow < rowCount; ++iRow) {
    rows[iRow]=[]
    for(var iCol=0; iCol < pagecols; ++iCol) {
      var iImg = startingImg + iRow * pagecols + iCol
      rows[iRow][iCol] = {
        dest: files[iImg],
        thumb: 'thumbs/'+iImg+'.jpg'
      }
    }
  }
  var filename = destdir+'/'
  if (i == 0) filename += 'index.html' else filename += 'page'+(i+1)+'.html'
  fs.writeFileSync(filename,jt({
    pagetitle: galtitle + ' - Page ' + (i+1) + ' of ' + pageCount,
    rows: rows,
    pagenum: i,
    totalpages: pageCount
    }))
}

//Generate thumbnails

for(var i=0; i < files.length; ++i) {
  gm(destdir+'/'+files[i])
    //Yes, this is wrong. I'm pressed for time, I'll get cropping right later.
    .resize(tsize,tsize)
    .write(destdir+'/thumbs/'+i+'.jpg')
}
