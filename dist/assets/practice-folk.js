(() => {
  'use strict';
  const lessons = (window.ShuLessons ||= {});
  const splints = '<g fill="#dbc295" stroke="#785b3b" stroke-width="1.2"><path d="M26 22h5v56h-5z M44 22h5v56h-5z M62 22h5v56h-5z M80 22h5v56h-5z"/></g>';
  const basket = '<g stroke="#72563a" stroke-width="1.3" fill="#e1bf87"><path d="M14 40q36 12 72 0l-10 33q-26 11-52 0z"/><ellipse cx="50" cy="40" rx="36" ry="9" fill="#f1dfb6"/></g><path d="M24 48l6 24m7-22 3 25m11-24v26m13-27-3 24m17-26-6 24m-49-13q29 12 57 0m-54 6q25 10 51 1" fill="none" stroke="#af885e" stroke-width="1.6"/>';
  const block = '<g stroke="#765638" stroke-width="1.6"><path fill="#b78050" d="M17 26l63-3 5 53-66 3z"/><path fill="#d8b07b" d="M17 22l64-2 3 52-65 3z"/></g><path d="M26 60q8-15 13-13-4-12 4-15l6 5 10 1q1 7-7 16 12-1 20-16-1 21-19 24-18-8-23 3" stroke="#674a35" stroke-width="2.4" fill="none"/>';
  const sheet = '<path d="M21 23l56-3 4 58-60 3z" stroke="#92785e" stroke-width="1.5" fill="#fbedd0"/>';
  const rack = '<g fill="none" stroke="#886446" stroke-width="3.6" stroke-linecap="round"><path d="M22 86l5-66 48-1 4 67M22 73l56-2M26 23l49-1"/></g><path d="M26 28l46-2 1 43-49 1z" fill="#f1dfb9" stroke="#aa8861" stroke-width="1"/>';
  const birdAreas = [
    'M24 49Q25 40 37 42Q39 54 53 57L68 52Q70 68 56 77Q42 84 33 76Q22 72 23 61Z',
    'M27 45Q31 39 38 43Q38 50 46 54L42 57L45 60L39 59L36 64L33 61L30 66L28 60Q24 57 27 45Z',
    'M39 57Q45 52 54 58Q60 60 68 57Q65 63 60 65L64 65Q57 73 49 73Q39 71 39 57Z',
    'M55 57Q65 49 74 33Q85 19 90 29Q93 34 87 42Q91 29 83 32Q77 36 73 49L64 63Z'
  ];
  const colors = ['#bb5846', '#dcaa50', '#70917e', '#557d93'];
  function bird(active) {
    return '<g transform="translate(0 -2)" stroke="#695542" stroke-linejoin="round">' +
      [3, 0, 1, 2].map(i => '<path d="' + birdAreas[i] + '" fill="' + (i <= active ? colors[i] : '#f4e4bd') + '" fill-opacity="' + (i === active ? '.65' : '.38') + '" stroke-width="1.3"/>').join('') +
      '<path d="M24 46l-7 3 7 2zm4-4q-9-11-2-9l5 5q-1-15 4-12l-1 12q10-12 10-5l-7 9" fill="#ce8468"/><circle cx="31" cy="46" r="1.2"/><path d="M40 75l-2 9-7 2m20-10 3 7 6 1M22 89q38-3 63-20" fill="none" stroke-width="1.6"/></g>';
  }

  lessons.bamboo = {
    question: '沿同一根纬篾绕篮看一圈。遇到相邻两根立骨时，纬篾分别从哪一侧绕过？',
    parts: [
      {name:'原料慈竹',detail:'长而光滑的竹节之间可以剖出连贯的长篾，供篮底、篮壁和收边使用。'},
      {name:'底经',detail:'平行排开的底经决定篮底的走向。起底时隔根挑起，给底纬留出穿行的缝。'},
      {name:'底纬',detail:'底纬横穿底经，一上一下交错。相邻两根底纬错开一个交点，搭出方格。'},
      {name:'篮壁纬篾',detail:'纬篾绕立骨内外交替穿过。将每一圈向下靠拢，篮壁便能保持紧密。'},
      {name:'夹口圈',detail:'口圈沿篮壁上缘夹住篾梢，用细篾缠扎，避免篾头在使用时翘起。'},
      {name:'竹提梁',detail:'弯成拱形的竹提梁，两脚相对固定在篮口，提起时两侧共同承重。'}
    ],
    stages: [
      {title:'备篾',observe:'看案边的竹筒和散开的薄篾。篮底要铺得平，同一组篾片应当宽窄相近。',
        operations:[
          {type:'choice',prompt:'从备好的慈竹中挑一段，准备取长篾。',options:['节间长、表面平顺的一段','从中间开裂的一段','节间短、弯折明显的一段'],answer:0,feedback:'这段竹子的纤维连贯，可以沿长向取篾。'},
          {type:'trace',prompt:'沿竹材的长向，从一端把薄篾顺着纤维分出。',tool:'篾片',points:[[15,68],[32,58],[49,48],[66,39],[84,30]],diagram:'<g stroke="#697355" stroke-width="1.6"><path d="M11 65L81 24l7 11-71 41Z" fill="#a3ae76"/><path d="M30 54l6 10m20-25 7 10" fill="none" stroke-width="3"/></g>',feedback:'篾片顺着纤维分开，既长又柔韧。'}
        ]},
      {title:'经纬起底',observe:'先铺底经，再穿底纬。看看侧面的交点，一根纬篾会在两根相邻底经之间换一次上下位置。',
        operations:[
          {type:'trace',prompt:'沿第一根底经的长向铺篾，把这一组篾条平行排齐。',tool:'底经',points:[[28,23],[28,40],[28,58],[28,76]],diagram:splints,feedback:'一组平行底经已经铺好，横向还留着穿纬的位置。'},
          {type:'trace',prompt:'看交点侧面，从左向右一挑一压，让纬篾交替跨过、穿过底经。',tool:'底纬',points:[[12,52],[28,40],[47,60],[65,40],[82,60],[91,53]],diagram:'<g fill="#e2c394" stroke="#876a43" stroke-width="1.2"><ellipse cx="28" cy="51" rx="5" ry="3.5"/><ellipse cx="47" cy="51" rx="5" ry="3.5"/><ellipse cx="65" cy="51" rx="5" ry="3.5"/><ellipse cx="82" cy="51" rx="5" ry="3.5"/></g>',feedback:'这一行跨上、穿下，紧邻的一行把上下位置对调。'}
        ]},
      {title:'编织篮壁',observe:'底面周边的篾梢要先立起来成为篮骨。纬篾绕骨编入，篮子才从平面长出侧壁。',
        operations:[
          {type:'trace',prompt:'从底边托住篾梢，顺着弧线扶起，使它成为立骨。',tool:'立骨',points:[[83,67],[78,53],[70,38],[65,25]],diagram:'<path d="M17 69q27 9 48-1l20-1" fill="none" stroke="#b88b50" stroke-width="4"/><path d="M63 68l2-43" stroke="#947954" stroke-width="1.5" stroke-dasharray="3 3"/>',feedback:'底边已有一圈立骨，可供纬篾攀绕。'},
          {type:'trace',prompt:'沿篮身绕行，让纬篾逐根绕过立骨，并把新编的一圈靠紧。',tool:'纬篾',points:[[18,47],[32,53],[51,55],[70,53],[83,47]],diagram:basket,feedback:'交替绕过的纬篾将立骨连成了篮壁。'}
        ]},
      {title:'锁口装提',observe:'篮口有散开的篾梢。口圈要先夹紧并缠牢，提梁的两脚才有稳定的落点。',
        operations:[
          {type:'trace',prompt:'从篮口左端起，沿口沿绕一周，用口圈夹住露出的篾梢。',tool:'口圈',points:[[15,40],[31,32],[53,31],[76,34],[85,40],[71,47],[48,49],[28,46],[15,40]],diagram:basket,feedback:'口圈包住了篾头，细篾将它与篮壁缠在一起。'},
          {type:'trace',prompt:'将提梁从一侧固定点弯向对侧，两个梁脚分别落在口圈上。',tool:'竹提梁',points:[[20,43],[25,29],[37,18],[50,15],[65,20],[75,30],[80,43]],diagram:basket,feedback:'两只梁脚相对并绑牢，提起时篮口两侧共同承重。'}
        ]}
    ]
  };

  lessons.print = {
    question:'把木版、墨层和纸张分开看。哪一层留下锦鸡的轮廓，羽毛的颜色又来自哪里？',
    parts:[
      {name:'反向木线版',detail:'版上的线条凸起，图形与成画左右相反。覆纸擦印后便得到正向轮廓。'},
      {name:'凸线墨层',detail:'排刷把薄墨铺在凸出的线条上，这些着墨处与纸接触，转印成黑线。'},
      {name:'印线纸',detail:'纸面贴住线版，棕擦在纸背压擦。揭起并翻正后，可以按印出的线稿着色。'},
      {name:'水色碟',detail:'不同颜色分碟调开，设色笔蘸取颜料，按锦鸡羽片、颈羽等区域手工敷色。'},
      {name:'晾画架',detail:'承托完成的年画，让刚设色的画面朝外，湿色处避开触碰。'}
    ],
    stages:[
      {title:'木版刷墨',observe:'辨认刷墨排刷和墨盘。先让刷面沾匀，再把墨带到凸起的版线上。',
        operations:[
          {type:'trace',prompt:'在墨盘上轻轻来回推匀，让排刷的刷面均匀蘸墨。',tool:'排刷',points:[[27,48],[50,48],[73,48],[54,54],[31,54]],diagram:'<rect x="16" y="34" width="68" height="33" rx="4" fill="#9e7755" stroke="#715841" stroke-width="2"/><rect x="21" y="39" width="58" height="22" rx="2" fill="#494842"/>',feedback:'刷面已沾墨，接下来可以沿版面薄刷。'},
          {type:'trace',prompt:'沿木版分行薄刷，上一行与下一行略有重叠，带到所有凸线。',tool:'排刷',points:[[24,31],[75,31],[75,49],[25,49],[25,66],[76,66]],diagram:block,feedback:'凸起的线条已着墨，凹下的空处会留下纸白。'}
        ]},
      {title:'覆纸拓线',observe:'木版上是反向花鸟。先对齐纸边，擦印时让纸贴稳，揭起才会看到正向墨线。',
        operations:[
          {type:'trace',prompt:'捏住白纸的空白边，从版的一边慢慢放平，盖住整块墨线版。',tool:'印线纸',points:[[26,23],[33,34],[42,44],[53,54],[66,64]],diagram:block,feedback:'纸边已对齐木版，接下来从纸背擦印。'},
          {type:'trace',prompt:'固定纸边，用棕擦从纸背分行往返，把压力送到各处版线。',tool:'棕擦',points:[[29,33],[72,33],[72,50],[29,50],[29,66],[72,66]],diagram:sheet,feedback:'纸面与着墨的凸线充分接触，墨线已转到纸上。'},
          {type:'trace',prompt:'捏住一个纸角，沿对角线慢慢揭起，把印线面翻朝上。',tool:'纸角',points:[[76,72],[66,62],[53,52],[40,41],[28,30]],diagram:sheet,feedback:'翻面后锦鸡朝向与木版相反，线稿已经可以设色。'}
        ]},
      {title:'手工设色',observe:'这张习作分胸羽、颈羽、翅片和长尾四笔示范。先找墨线围住的色块，再随羽毛走向下笔。',
        operations:[
          {type:'trace',prompt:'蘸朱红，在颈羽下方沿锦鸡胸腹的轮廓铺开第一块颜色。',tool:'朱红笔',points:[[27,62],[29,67],[33,72],[39,75],[45,76]],diagram:bird(0),feedback:'朱红胸羽为整只锦鸡定下暖色。'},
          {type:'trace',prompt:'换藤黄，从颈羽上缘顺势向下收笔，留清每束羽毛的墨线。',tool:'藤黄笔',points:[[32,45],[32,49],[33,52],[34,56],[34,59]],diagram:bird(1),feedback:'黄色颈羽与红胸相接，交界处仍看得见墨线。'},
          {type:'trace',prompt:'在翅片内从肩部向羽尖铺青绿，让笔尖沿覆羽的弧线前行。',tool:'青绿笔',points:[[42,58],[46,61],[50,63],[55,63],[60,61]],diagram:bird(2),feedback:'翅片的青绿衬出了暖色胸腹。'},
          {type:'trace',prompt:'蘸花青，顺长尾的弧度从羽根运到羽梢。',tool:'花青笔',points:[[61,55],[67,48],[73,38],[78,31],[84,28]],diagram:bird(3),feedback:'尾羽补好，锦鸡的各个色面仍由印出的墨线分隔。'}
        ]},
      {title:'揭挂晾画',observe:'画面刚设完色，拿取时留意空白纸边。挂画时上缘对齐，湿色面朝外。',
        operations:[
          {type:'trace',prompt:'从空白纸边提起成画，平稳托住上缘，把它送向晾画架。',tool:'空白纸边',points:[[73,71],[65,63],[58,53],[54,45],[50,37]],diagram:sheet,feedback:'纸面离开案板，接触的位置落在空白纸边。'},
          {type:'trace',prompt:'将纸的上缘送到横档下对齐，轻轻落定，使画面朝外舒展开。',tool:'画纸上缘',points:[[43,34],[47,27],[52,23],[55,26],[55,31]],diagram:rack,feedback:'年画已经挂稳，可以在架上晾干。'}
        ]}
    ]
  };
})();
