(() => {
  const lessons = (window.ShuLessons ||= {});
  // The drawings use the same 100 × 100 coordinate space as the traced gesture.
  const petal = '<path d="M50 85C21 67 22 37 50 13C78 38 79 65 50 85Z" fill="#e9b9ab" stroke="#775341" stroke-width="1.5"/>';
  const bamboo = '<path d="M50 85Q19 52 50 13Q83 53 50 85ZM50 85Q54 51 50 13M33 61Q50 66 68 60" fill="none" stroke="#a97946" stroke-width="2"/>';
  const bowl = '<path d="M9 35Q12 62 40 77L60 77Q86 62 91 35Q53 49 9 35Z" fill="#d6a779" stroke="#72513f" stroke-width="1.6"/><ellipse cx="50" cy="35" rx="41" ry="8" fill="#ebc491" stroke="#72513f" stroke-width="1.5"/><path d="M39 77V81Q50 85 61 81V77" fill="#bc895e" stroke="#72513f" stroke-width="1.5"/>';
  const lacquerPanel = '<path d="M7 23Q48 32 93 22L90 75Q48 87 10 76Z" fill="#95473f" stroke="#553434" stroke-width="1.5"/><path d="M11 27Q51 36 89 27M13 72Q52 81 87 72" fill="none" stroke="#d1a76d" stroke-width="1.4"/>';
  const swatches = '<rect x="5" y="30" width="42" height="42" rx="6" fill="#86483e"/><rect x="53" y="30" width="42" height="42" rx="6" fill="#893e33"/><path d="M15 60Q24 46 36 43" fill="none" stroke="#ad7969" stroke-width="6" stroke-linecap="round"/><path d="M63 60Q72 46 85 43M68 61Q74 53 80 51" fill="none" stroke="#f3d4a4" stroke-width="2.3" stroke-linecap="round"/>';
  lessons.lantern = {
    question: '转到花瓣背面，找一找彩绸靠哪几根篾条撑住。灯珠藏在哪一层里面？',
    parts: [
      {name:'八方灯座',detail:'托起莲花，把各瓣的重量经立柱传到底座。'},
      {name:'竹篾骨架',detail:'外圈定出瓣缘，中肋撑住绸面，横撑约束两侧的弧度。'},
      {name:'花瓣绸面',detail:'绸片沿瓣框贴合，把灯芯的光透成有层次的花色。'},
      {name:'LED 灯珠',detail:'位于莲蓬罩内，光从花心向内外两层花瓣散开。'},
      {name:'低压引线',detail:'从底座引到灯珠，与案上的电池盒相连。'}
    ],
    stages: [
      {title:'弯篾扎瓣',observe:'先看空瓣框。瓣尖、瓣根和中肋落在同一条线上，左右两边才撑得匀。',
        operations:[
          {type:'trace',tool:'竹篾',prompt:'从瓣根沿左缘弯到瓣尖，再顺右缘收回瓣根。',points:[[50,85],[35,68],[29,51],[34,34],[50,13],[66,34],[71,51],[65,69],[50,85]],diagram:bamboo,feedback:'两头在瓣根会合，外圈有了闭合的轮廓。'},
          {type:'choice',prompt:'横撑放在哪里，才能稳定这片瓣框？',options:['只绑在瓣尖上','跨过中肋，把两端扎在左右瓣缘','横放在灯座下面'],answer:1,diagram:bamboo,feedback:'三处交点扎牢后，横撑能约束两侧瓣缘。'}
        ]},
      {title:'分色裱绸',observe:'按色稿分出内外两层花瓣。先看绸片贴住的瓣根，再沿两侧检查余量。',
        operations:[
          {type:'sequence',prompt:'灯具与骨架已检查好，把三步裱绸操作按先后排好。',options:['顺着瓣框抚平绸面','按色稿裁出留边的绸片','在瓣框接触处刷胶'],order:[1,2,0],diagram:petal+bamboo,feedback:'先裁绸、后刷胶，最后趁胶合适时把绸片贴服。'},
          {type:'trace',tool:'裱绸刷',prompt:'沿中肋从瓣根抚向瓣尖，让绸面逐段贴服。',points:[[50,85],[50,71],[51,57],[52,43],[51,28],[50,13]],diagram:petal+bamboo,feedback:'绸片贴住瓣框，拱起的弧度随中肋成形。'}
        ]},
      {title:'勾描花脉',observe:'主脉贯穿瓣心，侧脉从主脉分出，收在瓣缘以内。',
        operations:[
          {type:'trace',tool:'描线笔',prompt:'顺着瓣心，从根部向瓣尖勾出一条主脉。',points:[[50,80],[49,66],[51,53],[52,41],[51,29],[50,19]],diagram:petal,feedback:'主脉先定下方向，侧脉有了起笔的位置。'},
          {type:'trace',tool:'描线笔',prompt:'从主脉中段分出侧脉，沿弧线向外提笔。',points:[[50,64],[54,58],[60,53],[64,46],[66,39]],diagram:petal+'<path d="M50 80Q53 51 50 19" fill="none" stroke="#904d42" stroke-width="1.7"/>',feedback:'侧脉从瓣心向外展开，线端留在绸面以内。'}
        ]},
      {title:'合罩试光',observe:'在模拟灯上改变亮度，比较花心与外瓣。花心亮起后，绸色和花脉仍应看得清。',
        operations:[
          {type:'range',prompt:'调节这盏样灯的亮度，在 55% 到 75% 之间观察透光的绸面。',min:0,max:100,start:0,target:[55,75],unit:'%',feedback:'花心照亮外瓣，花脉仍然可辨。'},
          {type:'choice',prompt:'沿花灯转一圈，哪种现象说明裱绸和试光都已到位？',options:['接缝透出一条刺眼的白隙','同一片花瓣上留着一道折痕','花瓣受光均匀，接边平整，花脉清楚'],answer:2,feedback:'侧看接边、正看花脉，便能一起检验绸面与光色。'}
        ]}
    ]
  };
  lessons.lacquer = {
    question:'把器壁的涂层分开，比较最厚的木胎、中间的灰层和最外层的漆面。哪一层给下一遍髹漆铺平了底？',
    parts:[
      {name:'实木胎',detail:'决定器形、口沿和足部的尺寸，也承托其上的各道涂层。'},
      {name:'底灰层',detail:'填补胎表的细小不平，干后磨平，给漆膜一个平整的底面。'},
      {name:'髹漆层',detail:'薄髹、阴干、研磨后再髹，漆层逐遍积成。剖面放大了它的厚度。'},
      {name:'漆面饰纹',detail:'本例在器壁绘出纹样，最后推光，让纹样在均匀的反光中显出来。'},
      {name:'灰料盘',detail:'盛放用来填平木胎的灰料，刮灰片从这里取料。'},
      {name:'漆盏',detail:'盛放调好的色漆。漆刷从盏中蘸漆，每次均匀铺一薄层。'}
    ],
    stages:[
      {title:'修整木胎',observe:'对照剖面样线，看口沿到足部之间的弧度。不同器形的轮廓不同。',
        operations:[
          {type:'trace',tool:'样板',prompt:'沿示意碗胎的一侧核对外形，从口沿顺到器足。',points:[[91,35],[87,47],[81,57],[72,66],[60,77]],diagram:bowl,feedback:'器腹到器足的过渡已经核对。'},
          {type:'choice',prompt:'把木胎放上转盘，哪一种状态适合继续做底灰？',options:['器足站稳，口沿转动时高低一致','器足一侧悬起，转动时轻晃','器口边缘还留有毛刺'],answer:0,diagram:bowl,feedback:'胎体端正并修平后，可以铺灰。'}
        ]},
      {title:'刮灰磨底',observe:'先把灰料摊薄，等灰层干后再磨平。转动器身看斜光，可以找到凸起的刮痕。',
        operations:[
          {type:'trace',tool:'刮灰片',prompt:'让刮片贴着器壁横向走一遍，把灰料摊平。',points:[[16,47],[29,50],[45,52],[60,52],[75,50],[85,47]],diagram:bowl,feedback:'刮片带走多余灰料，给低处留下薄薄的填层。'},
          {type:'trace',tool:'磨石',prompt:'灰层已经阴干。往返磨过这一小块，让相邻行程略有重叠。',points:[[24,52],[43,54],[67,53],[50,58],[34,59],[50,63],[68,60]],diagram:bowl,feedback:'凸起的刮痕被磨平，下一道漆能均匀铺开。'}
        ]},
      {title:'薄髹入荫',observe:'先在灰底上铺一遍漆，再拖动阴干时间轴。这里把一遍漆的阴干过程缩成相对进度，实际用时随漆料和环境而变。',
        operations:[
          {type:'trace',tool:'漆刷',prompt:'沿器壁从左至右薄髹一遍，保持相邻刷痕接续。',points:[[13,50],[28,53],[44,55],[58,55],[73,53],[87,50]],diagram:lacquerPanel,feedback:'这一遍已刷匀，接下来让新漆在荫处慢慢固化。'},
          {type:'range',prompt:'拖动模拟阴干时间轴，从刚入荫走到本遍干透的末端（100%），观察湿漆反光怎样收敛。',min:0,max:100,start:0,target:[100,100],unit:'%',feedback:'这一遍已阴干，工匠可研磨后再髹，逐层积漆。'}
        ]},
      {title:'饰纹推光',observe:'跟着斜光看漆面。推光前亮带宽而模糊，推光后亮带收窄，边缘更清楚。',
        operations:[
          {type:'trace',tool:'细笔',prompt:'沿云头转折勾一段图样，收笔时让线尾渐细。',points:[[15,61],[28,58],[37,48],[43,43],[49,46],[57,38],[64,39],[70,47],[76,45],[82,49],[78,54],[68,54]],diagram:lacquerPanel,feedback:'样线显示了云头和回锋；器身使用的是当前选定的饰纹。'},
          {type:'trace',tool:'推光布',prompt:'在已干的饰面上小圈推擦，让相邻两圈稍微搭接。',points:[[28,66],[20,55],[26,42],[39,39],[46,50],[39,61],[30,59],[36,48],[51,44],[63,49],[66,60],[56,67],[46,60],[49,53],[60,52],[72,58],[78,65]],diagram:lacquerPanel,feedback:'反光沿器壁连成细亮带，转动器身可以继续检查。'},
          {type:'choice',prompt:'比较同色漆样上的倒影，哪一块呈现推光后的效果？',options:['左样，反光边界散开','右样，反光边界清楚'],answer:1,diagram:swatches,feedback:'右样反光边缘更清晰。回看器身，口沿和器腹也有连续的亮带。'}
        ]}
    ]
  };
})();
