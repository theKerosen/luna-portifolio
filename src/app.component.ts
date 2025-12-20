import { ChangeDetectionStrategy, Component, signal, WritableSignal, OnInit, AfterViewInit, inject, ElementRef, OnDestroy, computed, effect, viewChild, ViewChild, ElementRef as NgElementRef, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare var THREE: any;

interface Project { title: string; type: { pt: string; en: string }; descPt: string; descEn: string; tech: string[]; url: string; }
interface Social { name: string; url: string; icon: string; }
interface Skill { name: string; icon: string; }

interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  order: number;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  workspace?: 'dev' | 'poetry';
  poemId?: string;
}

interface Poem {
  id: string;
  title: string;
  year: string;
  content: string;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  host: {
    '(window:mouseup)': 'onDragEnd()',
    '(window:mousemove)': 'onDragMove($event)',
    '(window:resize)': 'onResize()',
    '(document:mousemove)': 'onMouseMove($event)'
  }
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  developerName = signal('Luna T. G.');
  email = signal('contato@lunxi.dev');
  currentYear = new Date().getFullYear();

  lang = signal<'pt' | 'en'>('pt');

  t = computed(() => this.lang() === 'pt' ? {
    title: 'Engenheira de Sistemas & Automação',
    bio: 'Engenheira de sistemas de alta performance, especializada em redes P2P e automação em tempo real.',
    aboutQuote: '"Tecnologia suficientemente avançada é indistinguível de magia." — Arthur C. Clarke',
    aboutText: 'Atualmente focada em sistemas P2P, automação de infraestrutura e criando ferramentas.',
    aboutIntro: 'Programadora por vocação e engenheira por paixão. Com anos de experiência navegando pelas camadas profundas da computação, desenvolvi uma obsessão por',
    performance: 'performance',
    distributed: 'arquitetura distribuída',
    contactTitle: 'Conecte-se',
    contactText: 'Aberta a colaborações, projetos interessantes ou apenas um bom papo técnico.',
    readyText: 'Bem-vindo ao meu portfólio',
  } : {
    title: 'Systems & Automation Engineer',
    bio: 'High-performance systems engineer, specializing in P2P networks and real-time automation.',
    aboutQuote: '"Any sufficiently advanced technology is indistinguishable from magic." — Arthur C. Clarke',
    aboutText: 'Currently focused on P2P systems, infrastructure automation and building tools.',
    aboutIntro: 'Developer by vocation and engineer by passion. With years of experience navigating the deep layers of computing, I developed an obsession for',
    performance: 'performance',
    distributed: 'distributed architecture',
    contactTitle: 'Connect',
    contactText: 'Open for collaborations, interesting projects or just a good tech talk.',
    readyText: 'Welcome to my portfolio',
  });

  currentTime = signal('');
  protected Math = Math;
  protected Object = Object;
  private intervalId?: any;

  private elementRef = inject(ElementRef);
  private sanitizer = inject(DomSanitizer);
  private animationFrameId?: number;
  private scene: any;
  private camera: any;
  private renderer: any;
  private particles: any;
  private clock = new THREE.Clock();

  mousePosition = signal({ x: 0, y: 0 });
  isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  cmatrixCanvas = viewChild<NgElementRef<HTMLCanvasElement>>('cmatrixCanvas');
  cmatrixIntervalId = signal<any>(null);
  private cmatrixObserver: ResizeObserver | null = null;

  windows = signal<{ [key: string]: WindowState }>({
    'about': { id: 'about', title: '~/about.md', isOpen: true, order: 0, x: 50, y: 50, w: 500, h: 350, zIndex: 1, workspace: 'dev' },
    'projects': { id: 'projects', title: '~/projects', isOpen: true, order: 1, x: 580, y: 50, w: 500, h: 400, zIndex: 2, workspace: 'dev' },
    'fetch': { id: 'fetch', title: 'fetch', isOpen: true, order: 2, x: 100, y: 420, w: 550, h: 280, zIndex: 3, workspace: 'dev' },
    'skills': { id: 'skills', title: './list-skills.sh', isOpen: true, order: 3, x: 680, y: 470, w: 400, h: 250, zIndex: 4, workspace: 'dev' },
    'contact': { id: 'contact', title: '/etc/contact', isOpen: true, order: 4, x: 300, y: 200, w: 380, h: 320, zIndex: 5, workspace: 'dev' },
    'snake': { id: 'snake', title: './snake_game', isOpen: false, order: 5, x: 200, y: 100, w: 400, h: 480, zIndex: 6, workspace: 'dev' },
    'htop': { id: 'htop', title: 'htop', isOpen: false, order: 6, x: 650, y: 150, w: 350, h: 350, zIndex: 7, workspace: 'dev' },
    'cmatrix': { id: 'cmatrix', title: 'cmatrix', isOpen: false, order: 7, x: 400, y: 250, w: 450, h: 350, zIndex: 8, workspace: 'dev' },
    'steam': { id: 'steam', title: 'astranet --cs2', isOpen: true, order: 8, x: 300, y: 150, w: 480, h: 400, zIndex: 9, workspace: 'dev' },
    'explorer': { id: 'explorer', title: 'poemas da Luna', isOpen: true, order: 0, x: 50, y: 50, w: 600, h: 450, zIndex: 1, workspace: 'poetry' },
  });

  currentWorkspace = signal<'dev' | 'poetry'>('dev');

  poems = signal<Poem[]>([
    { id: '1', title: 'Asas Estáticas', year: '', content: `Asas a bater,\nBrilha? Não,\nOdeia todos,\nAté você.\n\nAmadurecer,\nSorrir ou crescer?\nCurar ou deixar arder?\n\nGritar é fútil,\nAqui o som não ecoa,\nNão há noite boa.\n\nSó pingos hei de escutar,\nPingos de lágrimas, pois,\nNão há água para gotejar.\n\nMetal velho soa e arranha,\nPodre como entranhas, mas,\nPrende lamentos e façanhas,\n\nO sol não nasce mais,\nOs guardas não vem,\nResta o chão frio,\nNão há ninguém.\n\nNão há entardecer,\nÉ sempre noite aqui,\nNão há como viver.\n\nA cor é azul escuro,\nO céu está vazio,\nEstá surdo.\n\nÉ animal e não fala,\nApenas late,\nRosna perante sua cara.\n\nUm dia parou,\nNão se mexeu,\nNem asas bateu.\n\nParou,\nTudo congelou,\nEntão o silêncio voltou.\n— "Luna T.G."` },
    { id: '2', title: 'A paz do silêncio', year: '', content: `Na falta do som, uma bela cidade se encontra, onde a natureza domina e vários animais lá você encontra. Nesta cidade, o céu não carrega poluição, pelo contrário, o ar enche vosso pulmão.\n\nNesta cidade, prédios não brilham neon, na verdade, nem brilho eles emitem. Essa linda metrópole que um dia habitada era, virou um lindo jardim com animais tagarelas.\n\nSuas flores que até o antigo concreto invadem, essas árvores onde até as menores vidas nascem e partem, as casas que um dia já tiveram dos demasiados tipos de pessoas com gostos e criatividade, seus prédios pintam um cenário à parte.\n\nComo um lindo local carrega uma história tão triste? Não sei e nunca irei saber, só sei que é lindo de se ver.\n~ Luna T.G.` },
    { id: '3', title: 'Nesta sala', year: '', content: `Nesta sala\nAlguém um café bebeu\nO amor se perdeu\nNa porta\nA cinza do cigarro cedeu\nO cheiro de podre apareceu\n\nNesta sala\nA flor cresceu e morreu\nO alto barulho desapareceu\nNo fogão\nA água ferveu\nO chá alguém bebeu\n\nNesta sala\nA cor nasceu\nO livro se leu\nNa cama\nA nossa filha nasceu\nO brilho da janela se manteu` },
    { id: '4', title: 'Entre o Chão e o Céu', year: '', content: `O chão gelado me lembra do céu azul e brilhoso.\n\nNo meu caminho de volta para casa,\nNão há uma pessoa na rua rasa,\nNão há uma alma viva nesse caminho de casa,\nO sol atrás de mim se põe sem parar,\nSerá que um dia as coisas vão mudar?\n\nAlto no ar,\nEntre o gelado chão e o céu azul brilhoso,\nCá estou eu,\nAdmirando a noite e seu esboço,\nAdmirando as estrelas que brilhas sem nenhum esforço.\n\nUm gato encontro,\nUm lindo gato preto dos olhos foscos,\nEntre o gelado chão e o céu brilhoso,\nUm gato me mostra seu amor caloroso,\nQuão lindo é seu sorriso amistoso?\n\nSempre ali,\nAndo no mesmo lugar,\nQue peso que é caminhar,\nQuando será que vou chegar?\n\nPerto estou,\nSerá que eles estão ou só estou?\n\nCá cheguei,\nAbri a porta e ninguém encontrei,\nTudo bem,\nUma hora os encontrarei,\n\nAlto no ar,\nEntre o gelado chão e o céu azul brilhoso,\nCá estou eu, só de novo,\nNão há problema,\nIrei deitar e esperar,\nUm dia será que vou poder respirar?\nSerá que um dia vou poder voltar?` },
    { id: '5', title: 'O mundo é um incrível lugar', year: '', content: `O mundo é um incrível lugar para (não) se estar!\n\nOntem foi tão quente,\nHoje foi tão morno,\nAmanhã será tão frio,\n\nAndo por ai,\nAndo por ai,\nO clima posso sentir,\nAs árvores balançam e o sol brilha aqui,\nAs flores se movem com a brisa suave ali,\nAndar e correr,\nAndar e correr,\nSinto meu corpo estremecer,\nRir e rir,\nAqui e ali,\nAqui e ali,\n\nAndo, eu ando,\nO mundo é um encanto,\nO sol brilha tanto,\nA cidade é barulhenta e tanto,\nO trem passa e eu me espanto,\nO som de seu apito é lindo no entretanto.\n\nAndo eu ando,\nO sol vai se pondo e a chuva vai entrando,\nOlá grupo, como vão?\nJá viram que o céu vai se fechando, então?\nVamos andar por ai, por quê não?\nVamos andar e explorar aquele abandonado vagão.\n\nParo eu paro,\nO sol já nascendo está,\nOnde você está?\nAh, achei você,\nNão vá longe novamente,\nNão quero me perder de você de repente,\nO sol já nasce, vamos continuar a caminhar?\n\nO sol está à brilhar,\nO sol está à brilhar,\nO sol está à brilhar,\nE logo eu vou andar,\nE logo vou seguir você até onde está,\nQue marcas são essas em você?\nBem, com isso não vou me importar!\n\nMe leve, ande, vamos lá,\nO som do apito do trem ainda ando à escutar,\nSerá que já já ele vai vir e ficar?\nVamos esperar, olha a luz dele, cá ele já está.\n\nAqui, vamos parar,\nEspera, vamos respirar,\nNão deixe isso te magoar,\nAqui, uma história vou te contar,\nIsso dói?\nNão precisa se preocupar.` },
    { id: '6', title: 'Causas Complicadas', year: '', content: `Algumas coisas são complicadas de esquecer\n\nSe pelos seus olhos eu pudesse ver,\nMinhas rosas acobertariam a você,\nSe pelas vossas simpáticas mãos pudesse antever,\nMinha constante incerteza poderia resolver.\n\nA paróquia imaginária avista por reflexões da água,\nTodos avistam a formosura de uma bela rosa sem espada,\nO mundo perante a sua pureza não é nada.\n\nBrilha linda flor,\nCresça por onde for,\nEscute o som deste louvor,\nDeixe com que o amor vença da dor,\nMostre o que uma vez me pertenceu,\nMostre o que uma vez foi meu.\n\nDeixe ir,\nEsvai-se já,\nO sol eventualmente irá apagar,\nPermita a luz da lua lhe confortar,\nJá que o lindo astro rei já aqui não mais está.\n\nFecha-te então,\nA porta do seu coração já não abre não,\nO berrar de um perdão não comove mais sentimentos de razão,\nAs fumaças de uma chama relaxam-te em vão,\nNada voltará a ser mais como era,\nNada voltará a ser são.` },
    { id: '7', title: 'Tinta Vermelha', year: '', content: `Se você pudesse encher minha caneta de tinta,\nEscreveria mais de mil histórias com palavras distintas,\nCom mais de mil palavras que poderiam um dia ser ditas.\n\nO pior sentimento de nossas vidas,\nO melhor sentimento de nossas vidas,\nSe misturá-los uma luz deve dar.\nCerto isso não está,\nEu e você estivemos no mesmo lugar.\n\nPegue essa caneta,\nPegue-a por favor,\nSe eu pudesse o gostar,\nIsso seria um favor,\nNão importa quando,\nNão importa como,\nMeu amor.\n\nEu pude ver seu corpo,\nEle estava lá,\nYou estava lá.\n\nPara todos tempos que tive que esconder-me,\nTinta vermelha sobre eles,\nOs condene!\nArrume-os por favor,\nRescreva-os, reinvente,\n\nPara minha vida de coisas indecisas,\nTinta vermelha sobre ela,\nA condene!\n\nMais que qualquer drama ou choro alto como sirenes,\nTinta vermelha neles,\nSuma com eles.\n\nMesmo que faminto esteja,\nMesmo que não consiga comer,\nNão importa de qualquer forma,\nDa vida irei correr,\n\nPegue essa caneta,\nPegue-a por favor,\nAntes de eu pensar,\nVocê sumiu como vapor,\nVocê veio aqui,\nVocê estava aqui,\nVolte por favor,\nNão diga adeus meu amor,\nNão diga por favor.\n\nPara o lugar que estavamos antes,\nPara o lugar que você estava antes,\nPara o lugar que espero antes.\n\nPegue essa vermelha caneta,\nPegue-a por favor,\nSe comparar tudo a todos é normal,\nMe responda amor,\nPor que continuo a chorar de dor?\n\nPela falta de todo sentido,\nContinuo e com tinta vermelha eu risco,\nApenas para passar o tempo enquanto minha vida reviso.\n\nO primeiro risco que risquei,\nÉ o último risco que riscarei,\nSe você ver o que eu já fez,\nNão seria nada feliz.` },
    { id: '8', title: 'Abraçando Espinhos', year: '', content: `Abraçando espinhos,\nÉ uma dor imagino,\nTentei contar-te-vos sobre meu caminho,\nNão consegui passar-te meu anseio,\nAh, quanto receio.\n\nE então,\nUma coroa de espinhos é minha paixão,\nSentir a dor da falta do perdão,\nEu imagino que sentimentos bons ainda virão,\nNão acredito em você, não.\n\nE então,\nPassarei-te-vos memórias de um tempo,\nPassei-te memórias que desintegram com o peso do vento,\nSegurei aquilo que para mim era um importante evento,\nE lá isso se foi como o esvair de um fraco pensamento.\n\nIrmão,\nTu para mim já foste um,\nSó que hoje tudo virou comum,\nNem um nenhum.\n\nAbraço espinhos então,\nNão posso reclamar, agora não,\nNão tenho como sair dessa situação, não,\nNão tenho saída fácil deste eterno corte, meu irmão,\nNão posso fechá-lo com um simples curativo, irmão.\n\nSe pudesse o mundo te contar, tudo iria mudar,\nUm livro iria te mostrar,\nUma imensa alegria iria remunerar,\nFinalmente a minha letra alguém poderia ler e amar,\nFinalmente minha escrita valeria a tinta a se pagar,\nSó que aquilo que escrevi com borracha apaguei,\nEu sonho com o dia que tudo que já desmanchei.\n\nAh se pudestes me ler,\nO desfeche de uma linda história,\nVocê iria se surpreender,\nSó que isso nunca acontecerá,\nPois, daqui a pouco, irei me apagar.` },
    { id: '9', title: 'One Punch!', year: '', content: `Intentions unmatched\nOverly opposed\nAs good as garbage\nOne Punch!\n\nHighs\nHighs and lows\nCan't you notice your mediocrity?\n\nHighs\nHighs and lows\nFor fun I'll show you my low\nFor fun I'll fight at my high\nI'll hide my feelings in plain sight\n\nYour reaction is the main show for me\nI can't have fun with idiocracy\nLove, love, love me!\nIt is about your voice\nIt is not a choice\nShow me, show me\nI'll see, I'll see\n\nEven if you fight\nI'll give you my best at night\nEven if you say no\nI don't give you that right\n\nLove\nLove you\nEven if I cry\nI'll be by your side!` },
    { id: '10', title: 'O Livramento', year: '', content: `DEZ\nZERO\nQUATRO\nHOJE DOIS\nAMANHÃ ZERO\nANTES SETE\nZERO DE NOVO\n\nMARCHA PARA CIMA\nMARCHA PARA BAIXO\nMARCHA PARA CIMA\nMARCHA PARA BAIXO\n\nESQUERDA VIRE A DIREITA\nDIREITA VIRE A ESQUERDA\nDIREITA VIRE A ESQUERDA\nESQUERDA VIRE A DIREITA\n\nVOCÊ\nVOCÊ ENLOQUECERÁ\nVOCÊ ENLOQUECERÁ QUANDO O VER\n\nVOCÊ NÃO\nVOCÊ NÃO PODE OLHAR PARA FRENTE E O VER\nVOCÊ NÃO PODE OLHAR PARA FRENTE E VER\nVOCÊ NÃO PODE OLHAR PARA FRENTE\n\nTENTE\nTENTE PENSAR\nTENTE TENTE TENTE\nTENTE TENTE ANDAR\nTENTE VER\n\nMARCHE PARA CIMA\nMARCHE PARA A DIREITA\nMARCHE PARA CIMA\nMARCHE PARA A ESQUERDA\n\nÉ TARDE PARA PERCEBER\nÉ TARDE\nÉ TARDE PARA O VER\n\nESTAMOS SOZINHOS\nESTAMOS SOZINHOS NESSE INFERNO\nESTAMOS SOZINHOS A SOFRER\n\nNÃO HÁ LIVRAMENTO DESTE INFERNO\nNÃO HÁ LIVRAMENTO\nNÃO HÁ\n\nNÃO\nNÃO, ELES VÃO MATÁ-LO QUANDO O VER\nNÃO, ELES VÃO MATÁ-LO QUANDO O VER\nNÃO DEIXE ISSO ACONTECER\n\nDEUS\nDEUS POR FAVOR ME DÊ A ESPERANÇA DE VIVER\nDEUS POR FAVOR ME DÊ A ESPERANÇA DE PODER VIVER\nDEUS ME IMPEÇA DE PENSAR E PERCEBER\nDEUS POR FAVOR\nDEUS ABRA A PORTA DOS CÉUS PARA EU ENTRAR\nDEUS FECHE A PORTA DESTE INFERNO E DEIXE EU MORRER\n\nNÃO TEM LIVRAMENTO DESTE INFERNO\n\nVOCÊ É UM\nVOCÊ É UM EGOÍSTA\nVOCÊ É UM EGOÍSTA\nVOCÊ CONDENOU A TODOS\nVOCÊ NÃO É MEU SALVADOR\nVOCÊ NOS MATOU\nVOCÊ NOS MATOU\n\nDEUS POR FAVOR ME IMPEÇA DE ENLOUQUECER\nDEUS POR FAVOR ME IMPEÇA DE MORRER\nDEUS POR FAVOR DEIXE EU OS VER\n\nTENTE\nTENTE VIVER\nTENTE VIVER OU MORRER\nTENTE VIVER OU MORRER\nTENTE VIVER\n\nNÃO TENHO LIVRAMENTO DESTE INFERNO\n\nENLOUQUEÇA AO VER\nENLOUQUEÇA AO VER\nENLOUQUEÇA AO VER\n\nNÃO DEIXE EU PENSAR\nNÃO DEIXE EU PENSAR\nME MANTENHA IMPEDIDO DE VER\nME MANTENHA IMPEDIDO DE VER` },
    { id: '11', title: 'O andar da cidade', year: '', content: `A viva cidade que à noite brilha com vida, ao dia nos apresenta linhas sinfonias e melodias. O carteiro que vossa carta entrega, logo a campainha toca. O vendedor de livros bate de porta em porta, e quando menos pensar, o som da cidade fica à mercê do mar.\n\nSe a cidade permitir, sempre viverei aqui. Se as luzes continuarem a brilhar, continuarei em vosso amor acreditar. Sempre que a lua o céu iluminar, lá vou estar. Enquanto o verde gramado continuar a cheirar logo ao cortar, a luz de meus pensamentos irá lhe recordar. Então vamos, na areia correr e dançar, enquanto os fogos do ano novo finalmente nos iluminar, há ainda várias conquistas que iremos alcançar.\nSe um dia uma lágrima dolorosa no chão cair e ecoar, não tema, pois mesmo apenas do céu estarei a observar, ao seu lado estarei para te consolar.\n\nIsso uma carta não é, mas sim uma história de amor e compreensão, fica na mão do leitor e sua imaginação de dar um final para este texto cheio de determinação.` },
    { id: '12', title: 'O peso do dizer', year: '', content: `Aqueles que um dia nunca vi,\nEvitarei de conhecer,\nAqueles que nunca ouvi dizer,\nNunca irei os entender.\n\nSe um dia minhas palavras o tocarem,\nLogo então, conseguirás me entender,\nMesmo que isso signifique um dia me esquecer,\nVocê irá ver o quanto isso significará para você.\n\nSe minhas palavras você então notar,\nO tempo já vai estar a terminar,\nAs letras você já não irá mais interpretar,\nMesmo que você consiga as juntar,\nO sentido que um dia tiveram, nunca mais terá.\n\nSe minha vermelha caneta um dia parar de riscar,\nTodo o sentido que carreguei se desfará,\nE a primeira letra que escrevi então irá se apagar,\nEntão, a luz de meus desejos irá se dissipar.\n\nAqueles que um dia então conheci,\nIrei finalmente os entender,\naqueles que sempre ouvi conversar,\nPara eles lá eu vou estar,\nMesmo que a luz passe a não me iluminar.` },
    { id: '13', title: 'Os fartos ruídos', year: '', content: `Os ruídos indicam a fuga,\nOs altos sons deixam em fúria,\nOs barulhos causam injúria.\n\nSe pudesse-vos nunca mais escutar,\nO sofrimento iria parar,\nSe pudesse-vos silenciar,\nA dor iria se encerrar.\n\nDo ecoar da simples gota de água o chão tocar,\nAté o forte construtor que está a trabalhar,\nO som deveria se dissipar.\n\nOuvir vossas dores e sofrimentos é ruim,\nOuvir o vai e vem do mundo assim,\nEscutar vários sons desordenados é horrível sim,\nEspero que esses barulhos cheguem ao fim.` },
    { id: '14', title: 'Inconsciente', year: '', content: `Após notar a falta de saber o presente,\nDepois de perceber que aqui já não me encontro consciente,\nVisto que a realidade e meus sonhos já não são tão divergentes,\nMe encontro pensando incansavelmente,\n\nSerá que no tempo parei?\nOu até,\nSerá que o tempo me parou?\nSerá que estou no presente?\nOu até,\nSerá que estou no passado e tudo isso é meu subconsciente?\n\nOlhando para frente,\nParece que o caminho é oculto,\nOlhando para trás,\nParece que percorri o mundo.\n\nJá não me vejo fazendo sentido,\nJá não me vejo o mesmo,\nJá não tendo a ser um só comigo mesmo,\nJá não tendo a ser um só.\n\nAs pequenas vozes fazem-se de grandes cantores,\nAs pequenas ações fazem-se de grandes amores,\nAs pequenas palavras fazem-se de grandes louvores,\nSeus feitos e conquistas, por mais que pequenos, fazem-te quem tu és.\n\nPor mais que desconexo, ainda há algo complexo,\nPor mais que desfeito, ainda há algo que será feito,\nLembre-se que na ausência, terás que fazer-te vossa presença,\nLembre-se que na falta de coerência, é necessário vossa presença.\n\nCom essas palavras eu poderia até me imaginar,\nMas será que mesmo assim, lá vou estar?\nNão, já não estarei, um dia o que fui, nunca mais serei.` },
    { id: '15', title: 'Dançarei Então', year: '', content: `Sempre na mesma,\nTudo sempre na média,\nSem mudanças drásticas,\nSempre na mesma miséria,\n\nToque em mim,\nEu sou real, não sou o fim,\nPense em mim,\nEstou aqui sim!\n\nEu vou enlouquecer,\nVou fazer você ver,\nEu vou deixar a anormalidade me envolver,\nE então vou te fazer me perceber.\n\nDo meu casulo vou sair,\nNão me deixe aqui,\nVou sair de dentro daqui,\nUma borboleta, irei surgir,\nVou voar e fugir daqui.\n\nJá enlouqueci, então,\nMinhas tentativas de voar foram em vão,\nNesta festa me encontro dançando em vão,\nJá que não sou notada pelo mundo são,\nVou deixar a minha anormalidade me dominar então,\n\nEntão vou dançar,\nVou te mostrar,\nMesmo com sapatos a me rodear,\nEu vou pular e dançar,\nNada vai me parar.\n\nUma flor na classe então,\nColocarão com razão,\nPagar com respeitos irão,\nMesmo que seja em vão,\nVou respeitar sua decisão.\n\nEntão vou mostrar e a todos provar,\nContinuo a dançar.` },
    { id: '16', title: 'O Eterno Fim', year: '', content: `Seis semanas no inferno passei, porém, continuo aqui, o tempo já não anda mais. O relógio já não avança seus ponteiros, o doce som dos pássaros já não escuto. Tudo está a sumir, memórias já não consigo lembrar, com meus olhos mal consigo enxergar, com minhas mãos mal posso sentir ou tocar. O frio logo chega para piorar. Sei que minha falta sentirás, porém, o inverno logo chegou para me buscar e não irei voltar. Ela usa um terno elegante, o inverno que carrega é incessante. Sua face mortal e putrida hei de medo causar, porém, dela não fugirás. Sua arma de brilho metálico é como um espelho, porém, apenas sua alma verá. Ela hoje veio me visitar, acho que neste lugar eu não deveria estar, já que nada hei de funcionar ou continuar. Não sinto falta de nada, sei que não posso voltar, já aceitei que aqui é meu novo lugar.\n\nMeus passos ecoam neste vazio, que logo abafa-se nas névoas do esquecimento. Seus dedos gélidos traçam um símbolo em meu peito, mesmo que afiados, nenhum sangramento é feito. Sua lâmina não corta carne, mas sim laços, arranca os nomes daqueles que já foram para o outro lado, faz a chuva cair no momento certo, apaga aquilo que é passado. Ela me convida para assistir quem fui e o que causei. Não assisto tudo aquilo com um sorriso, afinal, mais visitas dela eu já acarretei. Alguns dirão que falta minha sentirão, mas, nunca escutei um perdão de discussões em vão. Meu último suspiro agora é vento. Meu corpo faz parte deste imundo e frio chão. Sou um fantasma que geia nas teias da solidão. Seria este meu descanso eternal? Seria este meu sofrimento imortal?\nVejo rostos que amei dissolverem-se lentamente, será que esqueceram de mim? Será que minhas memórias se dissolveram? Ela dança em folhas mortas, com seu terno furado e rasgado. "Aqui é o eterno fim." — disse ela, murmurando em meu ouvido. Meu nome já não me pertence mais, lágrimas derramadas já não valem mais nada, chorar não trará aquilo que um dia fui. A neve cobre tudo que vejo, já fui esquecida há muito tempo. O ser que um dia fui, tornou-se palavras riscadas no livro dos vivos. Agora, não passo de restos biológicos. Cada osso exposto, cada carne apodrecida, isso reflete quem eu realmente era, uma existência estúpida com desejos patéticos.\n\nSua lâmina perfura meu peito sem dor, não sinto mais nada, apenas o cheiro da podridão — meu próprio odor. Finalmente enxergo um reflexo, nele há uma criança. Sou eu, é uma lembrança. Ela está chorando, se lamentando, sentindo dor. Alguém destruiu o que ela um dia amou. "Pronta para desistir de existir?" — O ser de luz me diz — não sou capaz de discordar, minha voz já não é capaz de ressoar. Na reflexão lembranças ainda avisto erros cometidos, amores não correspondidos, discussões e imprevistos, silêncios que soam como gritos. A lâmina escurece, raízes cor-de-piche me prendem e crescem, e então, um relógio brilhoso o ser de luz me oferece: "Aqui está o seu tempo" — Não há ponteiros, Não há horas ou minutos, apenas indicadores do que um dia foi o tempo que seguia para o leste. Aqueles que amei, grito por seus nomes, mas minha voz já não ecoa, já não sei meu próprio nome.\n\nNo final, este é meu fim. Não serei lembrada, anotada, chamada, vista nunca mais. Não tomarei café pela manhã, não jantarei à noite. Aqueles que me viram já superaram, aqueles que um dia amei, por outros serão amados. Isso não é como dizem, não é a paz. Eu não sou mais ninguém, não existo, não respiro, não sinto ou causo falta. Sou o que resultou do contato de uma velha caneta com um papel de carta. No final, não somos nada além de seres que seguirão para o seu eventual fim.\n\n— “Luna T. G.”` },
    { id: '17', title: 'Lembrar de Ti', year: '', content: `Eu,\nJá esqueci-me de como tu eras\nEu,\nJá esqueci-me de como o mundo era\nNão lembro de como cheguei neste lugar,\nSó sei que tenho pensamentos de uma mente frágil para me perturbar,\nMeu único sonho era lembrar,\nComo tu eras,\nComo tudo era,\nRetornar a nossa época,\nOnde andávamos por ai,\nsem pressa,\n'Teu rosto é familiar,\nPor favor espera!\nVolta aqui,\nNão vá tão depressa,\nDeixa eu te acompanhar,\nMostre o caminho,\nNão tenho pressa.` },
    { id: '18', title: 'Trem da Indecisão', year: '', content: `Não há coisa tão bela como tu,\nTeu jeito de agir,\nTão perfeito e tão sutil,\nSua mente,\ntão confusa,\nTeus sentimentos o abusam,\nA única coisa que lhe importa é a chuva,\nAs chuvas de verão que lhe trazem um sermão,\nFazem-te sentir a dor do perdão,\nAté veres o choro da perdição,\nOnde errastes, é a questão,\nTua vida é um vagão,\nNo trem da indecisão,\nSerá que vai pra esquerda,\nOu será que vai para direita?\nNão faço ideia, não.\nAceite meu perdão,\nA ponte que tu andas,\nEstá prestes a cair no abismo da depressão,\nPare e pense, não és valente.\nÉs covarde, medroso e impotente.` },
    { id: '19', title: 'Tudo é Temporário', year: '', content: `Confusão se alastra\nA verdade se afasta\nA realidade se desfaz\ntudo vira fumaça.\n//\nA vida é uma floresta,\nNela todos se perdem,\nTodos seguem o mesmo caminho,\nCheio de barro e espinhos,\nMuitas vezes ficam presos,\nPresos e com medo,\nMedo de amar,\nMedo de aceitar,\nOu até mesmo só falar.\n//\nMinhas tentativas são fúteis,\nSeus gritos são inúteis,\nSerá que somos se quer úteis?\nSe Deus quiser, eu espero um reencontro,\nNão é um afronto,\nIsso é apenas um ponto,\nEntenda, tudo é temporário,\nJaneiro passou rápido,\nJá já, é dezembro.` },
    { id: '20', title: 'O Trem das Cinco', year: '', content: `O tempo passa,\nA brisa empurra-me com tanta força,\nO azul do céu lembra-me de quando era criança,\nQuando não havia más lembranças,\nMinha mente definha e balança,\nNum mar de desconfiança.\n\nNado em um mar de confusão,\nOnde seu amor é minha única opção,\nGuia-me em vossa tempestade,\nSua onda de raiva bate no meu barco\ncom tanta voracidade,\nDemonstras tanta vontade,\nQue pena,\nIsso é só uma ilusão, culpa de minha idade.\n\nAs folhas laranjadas,\nMarcam meu caminho nas estradas,\nSou aquele vulto que vê parado no meio da rua,\nAtropele-me com seu medo,\nPrometo, não acontecerá nada.\n\nAproveite enquanto ainda existo,\nPois o próximo trem sai às cinco\nO destino dele é o infinito,\nVamos, se apresse, logo logo ele está vindo,\nMal exala de você, eu pressinto,\nConte-me tudo,\nJá que estou partindo.` },
    { id: '21', title: 'Falsa Luz', year: '', content: `Você falou que ia ficar,\nVocê falou que ia continuar,\nVocê até mesmo disse que nunca ia me largar,\nAgora a cá está,\nPerdido nesse imenso mar,\nSua cabeça o puxa para baixo,\nPara o solo deste farto mar,\nMar este que é tão cheio,\nTão cheio de perguntas,\nTão cheio de inseguranças,\nTão escuro, tão negro, tão sem mudança,\nTão cheio de insalubridade,\nTão cheio de lambança.\n\nVocê tenta tanto sair, se recuperar,\nPorém o mar sabe,\nAs ondas do mar querem que você suma,\nQue você acabe.\n\nO mar odeia você,\nÉ injusto não é?\nO mar amava o,\nOh, como pode, mar...\n\nSeu corpo,\nCorpo este que está perdido,\nÉ como se a água fosse vinho,\nSujo com sangue do seu ser,\nE então a noite vem vindo,\nA lua brilha como sempre,\nLuz que poderia olhar para sempre,\nÉ, ela hipnotiza infinitamente,\nFalsa, Falsa é a luz da lua imprudente.` },
    { id: '22', title: 'Horizonte em Frente', year: '', content: `Fomos esquecidos aqui por ‘Ele’, mesmo que a sua voz ainda ressoe.\n\nNão há mais nada a ser feito — sem um refúgio — sem um lugar para se esconder.\nMesmo que a impureza contamine as águas, é impossível de esquecer. Não há um objeti-\nvo. O tudo irá deixar de reviver. Há um local, talvez, onde se pode aceitar que o som\nirá esvaecer. A existência é como este rio seco — sem água, apenas frio — um pensamento\nsombrio e vasto.\n\nAo riscar o fósforo que um dia acendeu o pavio, será que esse espaço vazio se tor-\nnará um local novamente febril? Não. Nunca será o mesmo, afinal, não será um ser total-\nmente perfeito. Ele nos deixou, ele esperou esfriar para que nunca mais pudesse um dia\nvoltar. O que será dessa bela paisagem sem um iluminar de quem fez o sol brilhar? É pos-\nsível que seja possível. Não é impossível que a luz defina tudo que avisto, será possível\nque um dia verei tudo que há para ser visto?\n\nÉ de doer, um dia o sol se esconderá e todos piscarão de uma só vez.\nÉ de comemorar, será que poderemos retornar? A rua é longa, não quero mais andar, já\nnão podemos mais navegar. Será que o local que um dia chamei de lar, poderá para mim\nretornar? Não sei — as esperanças que tive já não retornam — os cantos de pássaros o\nmundo adornam, mesmo que agora, já não importam.\n\nA luz que ilumina já não acende — será hoje o fim deste calor ardente?\nÉ obrigação ter ações congruentes, mesmo que de repente, não seja algo que se enfrente,\nmesmo incessantemente, é necessário andar vendo o horizonte em frente. Será que essa é\na luz que me deixará descansar eternamente? O chão já não faz mas sentido — já não é pos-\nsível andar.\n\nO céu chora, mesmo que não há motivos para lacrimejar. O aflito ecoa, mas não é possível\nse magoar. O que dominou tudo? Será a reflexão do outro lado? Não enxergo se há um fundo,\nmesmo que seja necessário procurar. A raza criação, desde a invenção, define o fundo do\nque pensa em vão. É desconhecido, sons ecoam mas não fazem sentido, será um sorriso?\nNão — não faria sentido — é causado por um aflito. Já que o coração decidiu chorar — não é\npossível mais esperar, é necessário terminar, mesmo que haja maiores motivos para continuar.\n\nO som do tempo ecoa pelas paredes, é possível de se escutar — uma hora isso irá parar.\nO som é perturbante, é um som incessante, não é mais possível superar, o tempo terá que\nparar de contar para que seja possível voltar à andar.` },
    { id: '23', title: 'Três Desejos', year: '', content: `Eu vendi minha alma,\nEm troca dela eu pedi 3 desejos,\nUm deles foi perambular pela mente de outros sem receio,\nAndar por caminhos desconhecidos com cheio conhecimento,\nArrastar vossa cabeça a devaneios e desespero,\nArrasar sua linha de pensamento com anseios,\nAfrontar até os mais terríveis com seus medos.\n\nEu vendi minha alma,\nEm troca dela eu pedi mais 2 desejos,\nUm deles foi ouvir demônios e tornar da realidade seu medo,\nDe rir até dos piores feitos,\nDe chorar incansavelmente perante os próprios erros,\nDe amar o que os outros tanto repugnam e odeiam,\nDe beber seu sangue sem sentir nenhum efeito.\n\nEu vendi minha alma,\nEm troca dela eu pedi mais 1 desejo,\nEsse desejo foi sorrir perante a solidão,\nDe amar andar 100 anos sem ao menos sentir falta do seu coração,\nDe não sentir remorso por apagar até a luz que minha guia nessa escuridão,\nDe não se arrepender de ter sido tudo em vão,\nDe pegar essa vagão e nunca mais voltar atrás,\nDe deixar você descansar e ter sua paz.` },
    { id: '24', title: 'Tic Tac', year: '', content: `Tic, Tac,\nTic, Tac,\nNos momentos em que ando só,\nMinhas memórias esvaem-se como pó,\nMeus sentimentos cruzam-se como um nó,\nEu ando no nunca sempre só,\nEu vejo tudo só que tudo é nada, sempre só,\nEu toco o pó de um lago que um dia água foi,\nEu respiro um ar que respirável um dia foi,\nEu vivo então e o relógio toca em vão,\n\nTic, Tac,\nTic, Tac,\nAs horas passarão,\nO relógio soa tão alto então,\nPara lá e para cá seu pêndulo vai e vem então,\nO som do seu coração é tão tocante quanto um violão,\nEu vi a rosa que um dia se abriu e brilhou, murchar na minha frente então,\nA aparência do mundo que um dia foi lindo e brilhoso hoje é assustador, não?\nO relógio já parou de tocar e eu continuo a pensar,\nIrei contar as horas apenas para poder voltar a te amar,\nQuero ver, quero ver,\nO brilho vitral dos seus lindos olhos cheios de brilho do sol,\nAh, eu quero ver o mar,\nAh, eu quero ainda poder ver como é te enxergar,\nAh, eu quero é poder te tocar,\nMas não posso então, pois 6 em ponto já são,\nEntão irei me despedir desse lindo mundo criado em vão.\n\nTic, Tac,\nTic, Tac,\nAs horas pararão,\nO mundo pausará então.` },
    { id: '25', title: 'A Falta de Alguém', year: '', content: `Sinta a falta de ser alguém\n\nPensa e repensa,\nAnda e anda,\nReclama ao doce vento,\nAo doce vento que sopra,\nDoce vento que balança.\n\nSe você cair,\nSerá que vão ajudar?\nE se fostes só uma árvore,\nUma árvore prestes a tombar,\nSerá que nesta solidão irão escutar?\n\nAnde na floresta,\nGrite à beça,\nÉ liberdade ou solidão?\nPois não há ninguém,\nNão há um ser nesta sua festa.\n\nTeu sorriso é importante,\nPorém de que vale,\nNão há um brilho exuberante,\nSó lágrimas relutantes.\n\nSinta a falta,\nVeja o amor em pauta,\nSinta a dor da falta,\nFalta essa que não mereceu,\nPorém, o sentiu e doeu.` },
    { id: '26', title: 'Luna', year: '', content: `Luna, O diabo irônico e o anjo platônico\n\nLuna, um gato frajola (ou calico), pelo menos em personalidade, é o puro divino, mas também a pura maldade. Se o dia está ruim, possa ter certeza de que vai piorar, porém, se o dia está bom, só tende a melhorar. Deitado no sofá? Luna está em cima. Deitado na cama? Luna já está de pijama. Vai e vem, Luna sempre surge do além, vem e vai, logo ela escorrega e cai.\nDá medo as vezes, ela fica tão brava e eloquente derrepente, mas ali embaixo ainda tem um sorriso bobo e inocente, esperando um abraço carente. As vezes, senta na janela, sempre escrevendo, nunca foi tagarela, sempre só ela, ela e ela. Nada revela, sempre é uma decisão incerta escolher algo com ela. Sonolenta, dorminhoca, dorme até encostada na porta. "Acorda, 'Lun, 'vamo" — é tudo que se escuta — seja na cama, na janela, na cadeira ou no sofá, ela continua em uma sonolência profunda. Não interajo vocalmente com ela, já que, novamente, não é tagarela, só se comunica com escrita, movimentos e piscadelas. Morde quando sente raiva, morde quando está feliz demais, não deixa meu braço ou meus dedos em paz.\nBruta? Sempre que pode, porém, sempre toma o norte, sem piedade, ela fala a verdade 'num corte. As vezes uma criança, as vezes uma adulta, eu acho que ela é meio biruta, porém, ela segue sua própria conduta.\nDe noite, ela é elétrica como um raio, corre e pula sem um desmaio. Luna é um gato que se porta até como raposa, de dia dorme, de noite acorda a moça. Ela toma café mas quem disse que quatro xícaras mantém ela de pé? Independente, eu gosto assim, ela a noite fica até mais carente, se é que me compreende.` },
    { id: '27', title: 'Repetição', year: '', content: `Começa tudo de novo,\nA clara neve reflete meus sentimentos,\nAh, como é um tormento acordar então,\n"Que tédio, tudo isso é em vão.",\n\nEu vou te mostrar, é de assustar,\nQue vida mal vivida!\nNão adianta gritar,\n"Você não irá se safar!",\n\nEntregar tudo eu quero então,\nCansei de você, quero te ver,\nEu quero te entender,\nEu não quero morrer,\n\nVou e me preparo então,\nQue depressão,\ntudo sempre igual então,\n\nJá enlouqueci,\nJá-já vou sumir,\nQuero morrer aqui!\nJá não adianta chorar,\nNão consigo me sustentar,\nAcho que vou me matar!\n\nJá é noite então,\nQue decepção,\nNão tenho coragem, não.` },
    { id: '28', title: 'Ao longe da sociedade', year: '', content: `Viver ao longe da sociedade cria uma visão de repúdio, onde todo pequeno erro é monstruoso, todo pequeno detalhe despercebido é grotesco. Porém, quando estamos no meio do tal caos, pequenos fragmentos de acontecimentos que antes eram bagunça, agora, não existem. Cega-se aquele que ousa viver no mundo realista do dia-a-dia, porém, enxerga demais aquele que vive no mundo da fantasia. Isolar-se do universo é criar desavenças com a vida; discutir com o universo entre 4 paredes, para que nada saia, porém, tudo fique preso.\nA fobia do mundo corrido, onde tudo escorre pelas suas mãos que nem água, afeta a todos. Esvai-se aquela vontade de buscar a vontade à vontade. Foge aquela coragem de buscar a verdade pela eternidade. Qual é o motivo de estarmos aqui? Todos perguntam a mesma coisa, usando a mesma ferramenta: o poder do pensar e do comunicar. Para qual fim podemos nos comunicar? Quem, ou melhor, quando a humanidade decidiu que rochas, ruídos, grunhidos e desenhos na parede não eram mais o suficiente? Seriam posteriores projetos de humanóides também sofredores? Queriam eles descobrir também onde estão?\nPodemos chorar, espernear, chutar o ar em protesto, porém, nada nos salva da solidão que recua no meio do dia e retorna à noite. Para alguns, ela nunca vai embora em primeiro lugar, mas, para outros, há algo além: a fé. A crença de que tudo não é apenas um mísero ato de coincidência em vão. Entretanto, seria a falta de razão a explicação perfeita para a razão existir? Assim como a incerteza leva a certeza, a razão nos faz desacreditá-la de propósito, mas, isso é culpa do orgulho, afinal, somos instruídos a não estar no erro, mesmo que isso nos ensine a como nunca mais ficar nele, não é?\nOuvi várias histórias de pessoas de grande sorte que acabaram perdendo tudo, na maioria das vezes por enfermidade, condições mentais, físicas ou medo. Isto é justo de alguma forma? Ora, sentimos medo o tempo todo. Adoecemos por motivos que, às vezes, nem sabemos ou não temos culpa. Mas, agora pergunto-te: Por que precisamos conquistar tudo? Ou, até, por que precisamos adoecer, sentir medo? Por quê? Só “Ele” pode responder, afinal, não somos capazes de atingir uma sinestesia de axiomas suficiente para explicar isso.\nSeria eu o motivo de tanto sofrimento promovido por outras almas, que, às vezes, sofrem tanto quanto ou mais? Não, a culpa nunca foi minha, mas de tolos que refletem vossa dor interna em meus olhos. Não me leve a mal, todos botamos frustrações internas, autodegradação, preocupação ou insegurança em corpos que não são apenas o nosso próprio. Mesmo sabendo disso, o próximo ainda sofre injúria, pois, virou princípio humano sofrer de um sofrimento causado pelo sofrido.\n— “Luna T. G.”, 05.07.2025` },
    { id: '29', title: 'Ação e reação', year: '', content: `Tu gritas, escuto com agilidade,\nPena que você já tem idade,\nEu escuto vossa dor em forma de saudade,\nVocê chora lágrimas de sangue,\nSeu choro é de verdade,\nO tempo esconde a verdade,\nO medo esconde a saudade,\nA frieza esconde a maldade.\n\nOh, meu amor,\nPor favor,\nSinalize teu amor,\nMe mostre a dor,\nLibere o que causa aflição,\nE então, \nVenha me abraçar,\nEu sempre vou te amar.` },
    { id: '30', title: 'O rei de ninguém', year: '', content: `Oh, meu rei,\nO céu já não brilha tão bem,\nIremos recuar, nossas terras não valem a vida,\nDeixe o inimigo avançar,\nJá não podemos atacar.\n\nO teu pedido já não será cumprido,\nO rei já não é mais querido,\nOs céus já não dão mais ouvidos,\nNós estamos perdidos.\n\n"Vá em frente" — diz o soldado valente,\nCoitado do cavaleiro inocente,\nJá não percebe o que é evidente.\n\n"Levante sua espada, essas feridas não são nada",\nO soldado valente larga um rugido potente,\nUm leão super exigente,\n"Angarde! Vamos minha gente",\n"Somos capazes, nosso rei não está presente",\n"Que deus todo-poderoso seja onipotente, que tenha misericórdia da gente".\n\nLogo depois de algum tempo,\nO céu já brilha há anos,\nO campo, mesmo que explodido, está vibrando,\nAs flores que sumiram já vão chegando,\nElas trazem a paz no campo,\nLogo os animais vão chegando.` },
    { id: '31', title: 'No banco da esquina', year: '', content: `Vejo uma luz natural,\nVejo uma porta aberta até o final,\nVejo um casal desigual,\n\nSinto uma brisa gelada,\nSinto o banco frio,\nSinto o gélido chão ardío,\n\nJá não sento mais lá,\nAgora há jovens a me perturbar,\nJá não há paz naquele lugar,\n\nMeu ônibus hei de passar,\nMas não há lugar para esperar,\nNem em pé posso aguardar,\n\nNão há conhecidos,\nNão há amigos,\nApenas rostos de outro lugar.\n\nEascondo minha cara na escrita,\nNão há o que conversar,\nSó posso esperar até o o ônibus chegar.\n\nAguardo ele,\nVenha me buscar,\nVou indo até lá` },
    { id: '32', title: 'No canto da sala', year: '', content: `Há infortúnios,\nHá algo de errado,\nHá ddor e desespero lá,\nHá vontade de gritar.\n\nNo canto dda mente,\nHá algo inocente,\nHá um amor imprudente,\n\nNo canto do coração,\nSó há gelo,\nNão há o calor da euforia.\n\nÉ o fim,\nO canto da alma,\nEle já virou marfim.` },
    { id: '33', title: 'No lado do bar', year: '', content: `Há um lugar,\nOnde sonhadores se encontram,\nOnde o amor é um fardo,\nOnde odiar é amar,\n\nNesta mesa sentam homens alterado,ss\nEnxergam um mundo azarado,\nMalditos sentimentos desgraçados.\n\nNesta Nesta noite o silêncio reina,\nO odor de álcool não me queima,\nNão há ninguém aqui na segunda-feira.\n\nChoram de lamentação,\nO bar fede a rum do teto ao porão,\nNesta mesa não há ninguém são.\n\nUm sente falta,\nUm sente desespero,\nO outro nem palavras mede.\n\nTriste destas almas,\nPobres almas de piche,\nMas o amor não desiste.\n\nE eu? Julgo sem conhecer,\nVejo sem entender,\nMas, eles lembram você.` }
  ]);
  activeWindowId = signal<string | null>('steam');
  maxZIndex = signal(10);

  gap = signal(8);

  openWindows = computed(() => {
    return Object.values(this.windows())
      .filter((w: WindowState) => w.isOpen && (!w.workspace || w.workspace === this.currentWorkspace()))
      .sort((a: WindowState, b: WindowState) => a.order - b.order);
  });

  gridLayout = computed(() => {
    const count = this.openWindows().length;
    const layouts: { [key: number]: { cols: number; rows: number } } = {
      0: { cols: 1, rows: 1 },
      1: { cols: 1, rows: 1 },
      2: { cols: 2, rows: 1 },
      3: { cols: 3, rows: 1 },
      4: { cols: 2, rows: 2 },
      5: { cols: 3, rows: 2 },
      6: { cols: 3, rows: 2 },
      7: { cols: 4, rows: 2 },
      8: { cols: 4, rows: 2 },
      9: { cols: 3, rows: 3 },
    };

    if (layouts[count]) {
      return layouts[count];
    }

    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    return { cols, rows };
  });

  gridCols = computed(() => this.gridLayout().cols);
  gridRows = computed(() => this.gridLayout().rows);

  lastRowStartIndex = computed(() => {
    const count = this.openWindows().length;
    const cols = this.gridCols();
    const fullRows = Math.floor(count / cols);
    return fullRows * cols;
  });

  windowsInLastRow = computed(() => {
    const count = this.openWindows().length;
    return count - this.lastRowStartIndex();
  });

  getGridColumn(idx: number): string {
    const count = this.openWindows().length;
    const cols = this.gridCols();
    const lastRowStart = this.lastRowStartIndex();
    const inLastRow = this.windowsInLastRow();

    if (idx < lastRowStart || inLastRow >= cols || cols <= 1) {
      return 'auto';
    }

    const positionInLastRow = idx - lastRowStart;
    const totalSpan = cols;
    const baseSpan = Math.floor(totalSpan / inLastRow);
    const remainder = totalSpan % inLastRow;

    const span = baseSpan + (positionInLastRow < remainder ? 1 : 0);
    return `span ${span}`;
  }

  cpuValues = signal([67, 45, 23, 89]);
  memoryValue = signal(72);

  steamData = signal<any>(null);
  steamNews = signal<any[]>([]);
  steamLoading = signal(false);
  steamError = signal<string | null>(null);
  serverStatus = signal<any>(null);
  hypeData = signal<any>(null);
  diffDetails = signal<any>(null);
  diffDetailsLoading = signal(false);
  showDiffDetails = signal(false);
  expandedBlocks = signal<Set<string>>(new Set());

  private htopInterval?: any;

  updateHtopValues() {
    const current = this.cpuValues();
    this.cpuValues.set(current.map(val => {
      const delta = Math.floor(Math.random() * 10) - 5; // -5 to +5
      return Math.max(5, Math.min(95, val + delta));
    }));

    const memDelta = Math.floor(Math.random() * 6) - 3;
    this.memoryValue.set(Math.max(50, Math.min(90, this.memoryValue() + memDelta)));
  }

  toggleLang() {
    this.lang.set(this.lang() === 'pt' ? 'en' : 'pt');
  }

  draggingWindowId = signal<string | null>(null);
  dragOverWindowId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const canvasEl = this.cmatrixCanvas()?.nativeElement;
      if (canvasEl && !this.cmatrixIntervalId()) {
        this.startCMatrixAnimation(canvasEl);
      } else if (!canvasEl && this.cmatrixIntervalId()) {
        clearInterval(this.cmatrixIntervalId());
        this.cmatrixIntervalId.set(null);
        this.cmatrixObserver?.disconnect();
        this.cmatrixObserver = null;
      }
    });
  }

  ngOnInit(): void {
    this.updateTime();
    this.intervalId = setInterval(() => this.updateTime(), 1000);
    this.htopInterval = setInterval(() => this.updateHtopValues(), 800);

    // Restore state from local storage (Stale-While-Revalidate)
    const savedStatus = this.loadState<any>('steamData');
    if (savedStatus) this.steamData.set(savedStatus);

    const savedNews = this.loadState<any[]>('steamNews');
    if (savedNews) this.steamNews.set(savedNews);

    const savedServers = this.loadState<any>('serverStatus');
    if (savedServers) this.serverStatus.set(savedServers);

    const savedDiff = this.loadState<any>('diffDetails');
    if (savedDiff) this.diffDetails.set(savedDiff);

    this.fetchSteamData();
    setInterval(() => this.fetchSteamData(), 30000);
  }

  async fetchSteamData(): Promise<void> {
    try {
      // Only show loading if we don't have data
      if (!this.steamData()) this.steamLoading.set(true);
      this.steamError.set(null);

      const [statusRes, newsRes, serversRes, hypeRes] = await Promise.all([
        fetch('https://api.ladyluh.dev/steam/status'),
        fetch('https://api.ladyluh.dev/steam/news'),
        fetch('https://api.ladyluh.dev/steam/servers'),
        fetch('https://api.ladyluh.dev/steam/hype')
      ]);

      if (!statusRes.ok) throw new Error('API offline');

      const statusData = await statusRes.json();
      this.steamData.set(statusData);
      this.saveState('steamData', statusData);

      if (statusData.has_update) {
        this.fetchDiffDetails();
      }

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        const news = newsData.news || [];
        this.steamNews.set(news);
        this.saveState('steamNews', news);
      }

      if (serversRes.ok) {
        const serversData = await serversRes.json();

        // Map new API schema to template schema
        const mappedData = {
          ...serversData,
          cs2_sessions: serversData.sessions,
          matchmaking_scheduler: serversData.scheduler,
          steam_web_api: serversData.steam_web_api ?? 'unknown'
        };

        this.serverStatus.set(mappedData);
        this.saveState('serverStatus', mappedData);
      } else {
        const fallback = {
          steam: statusData.player_count > 0 ? 'online' : 'unknown',
          cs2: statusData.player_count > 0 ? 'online' : 'unknown',
          matchmaking: statusData.player_count > 100000 ? 'normal' : 'low'
        };
        this.serverStatus.set(fallback);
        this.saveState('serverStatus', fallback);
      }

      if (hypeRes.ok) {
        const hype = await hypeRes.json();
        this.hypeData.set(hype);
        // this.saveState('hypeData', hype); // Optional persistence
      }
    } catch (err: any) {
      this.steamError.set(err.message || 'Falha ao conectar');
      if (!this.serverStatus()) {
        this.serverStatus.set({ steam: 'unknown', cs2: 'unknown', matchmaking: 'unknown' });
      }
    } finally {
      this.steamLoading.set(false);
    }
  }

  formatDate(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  }

  formatUptime(seconds: number): string {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${mins}m`;
  }

  cleanNewsContent(content: string): string {
    if (!content) return '';
    return content
      .replace(/https?:\/\/[^\s<]+/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\[img\][^\[]+\[\/img\]/gi, '')
      .replace(/\{STEAM_[^}]+\}/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150);
  }

  async fetchDiffDetails(): Promise<void> {
    // If we are already loading, skip
    if (this.diffDetailsLoading()) return;

    // Only show loading if we don't have data
    if (!this.diffDetails()) this.diffDetailsLoading.set(true);

    try {
      const res = await fetch('https://api.ladyluh.dev/steam/diff/details');
      if (res.ok) {
        const data = await res.json();
        this.diffDetails.set(data);
        this.saveState('diffDetails', data);
      }
    } catch (err) {
      console.error('Failed to fetch diff details:', err);
    } finally {
      this.diffDetailsLoading.set(false);
    }
  }

  async toggleDiffDetails(): Promise<void> {
    const isShowing = this.showDiffDetails();
    this.showDiffDetails.set(!isShowing);

    if (!isShowing && !this.diffDetails()) {
      await this.fetchDiffDetails();
    }
  }

  toggleBlock(category: string): void {
    const current = this.expandedBlocks();
    const newSet = new Set(current);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    this.expandedBlocks.set(newSet);
  }

  isBlockExpanded(category: string): boolean {
    return this.expandedBlocks().has(category);
  }

  // Pagination for heavy string lists
  stringLimits = signal<{ [key: string]: number }>({});
  readonly INITIAL_LIMIT = 50;
  readonly LOAD_MORE_STEP = 200;

  getStringLimit(category: string): number {
    return this.stringLimits()[category] || this.INITIAL_LIMIT;
  }

  showMoreStrings(event: MouseEvent, category: string): void {
    event.stopPropagation();
    const current = this.getStringLimit(category);
    this.stringLimits.update(limits => ({
      ...limits,
      [category]: current + this.LOAD_MORE_STEP
    }));
  }

  private saveState<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }

  private loadState<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
      return null;
    }
  }

  ngAfterViewInit(): void { this.initWebGL(); }
  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.htopInterval) clearInterval(this.htopInterval);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.cmatrixIntervalId()) clearInterval(this.cmatrixIntervalId());
    if (this.cmatrixObserver) this.cmatrixObserver.disconnect();
  }

  updateTime(): void {
    this.currentTime.set(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }

  getPoemById(id?: string): Poem | undefined {
    if (!id) return undefined;
    return this.poems().find(p => p.id === id);
  }

  toggleWindow(id: string): void {
    const isClosingCmatrix = id === 'cmatrix' && this.windows()[id].isOpen;
    if (isClosingCmatrix) {
      if (this.cmatrixIntervalId()) {
        clearInterval(this.cmatrixIntervalId());
        this.cmatrixIntervalId.set(null);
      }
    }

    this.windows.update(windows => {
      windows[id].isOpen = !windows[id].isOpen;
      return { ...windows };
    });
    this.activeWindowId.set(id);
  }

  setWorkspace(ws: 'dev' | 'poetry') {
    this.currentWorkspace.set(ws);
    // Focus first open window in new workspace if any
    const firstOpen = this.openWindows()[0];
    if (firstOpen) this.activeWindowId.set(firstOpen.id);
  }

  openPoem(poemId: string) {
    const poem = this.poems().find(p => p.id === poemId);
    if (!poem) return;

    const windowId = `poem-${poemId}`;

    this.windows.update(windows => {
      if (!windows[windowId]) {
        windows[windowId] = {
          id: windowId,
          title: `${poem.title}.txt`,
          isOpen: true,
          order: Object.keys(windows).length,
          x: 100 + (Math.random() * 200),
          y: 100 + (Math.random() * 200),
          w: 400,
          h: 500,
          zIndex: this.maxZIndex() + 1,
          workspace: 'poetry',
          poemId: poemId
        };
      } else {
        windows[windowId].isOpen = true;
      }
      return { ...windows };
    });

    this.focusWindow(windowId);
  }

  closeWindow(event: MouseEvent, id: string): void {
    event.stopPropagation();
    if (id === 'cmatrix' && this.cmatrixIntervalId()) {
      clearInterval(this.cmatrixIntervalId());
      this.cmatrixIntervalId.set(null);
    }
    this.windows.update(windows => {
      windows[id].isOpen = false;
      return { ...windows };
    });
    if (this.activeWindowId() === id) {
      const nextWindow = this.openWindows()[0];
      this.activeWindowId.set(nextWindow ? nextWindow.id : null);
    }
  }

  focusWindow(id: string): void {
    this.activeWindowId.set(id);
    const newZ = this.maxZIndex() + 1;
    this.maxZIndex.set(newZ);
    this.windows.update(windows => {
      windows[id].zIndex = newZ;
      return { ...windows };
    });
  }

  dragX = signal(0);
  dragY = signal(0);

  onDragStart(event: MouseEvent, id: string): void {
    event.preventDefault();
    this.draggingWindowId.set(id);
    this.dragX.set(event.clientX);
    this.dragY.set(event.clientY);
    this.focusWindow(id);
  }

  onDragMove(event: MouseEvent): void {
    if (!this.draggingWindowId()) return;

    this.dragX.set(event.clientX);
    this.dragY.set(event.clientY);

    const dragOverElement = document.elementFromPoint(event.clientX, event.clientY)?.closest('.window-tile');
    if (dragOverElement && dragOverElement.id !== this.draggingWindowId()) {
      this.dragOverWindowId.set(dragOverElement.id);
    } else {
      this.dragOverWindowId.set(null);
    }
  }

  onDragEnd(): void {
    const sourceId = this.draggingWindowId();
    const targetId = this.dragOverWindowId();

    if (sourceId && targetId) {
      this.windows.update(windows => {
        const sourceOrder = windows[sourceId].order;
        windows[sourceId].order = windows[targetId].order;
        windows[targetId].order = sourceOrder;
        return { ...windows };
      });
    }

    this.draggingWindowId.set(null);
    this.dragOverWindowId.set(null);
  }

  snakeInterval: any;
  snake = signal<{ x: number, y: number }[]>([{ x: 5, y: 5 }]);
  food = signal<{ x: number, y: number }>({ x: 10, y: 10 });
  direction = signal<{ x: number, y: number }>({ x: 1, y: 0 });
  isSnakePlaying = signal(false);
  directionLocked = signal(false);

  startSnake() {
    if (this.isSnakePlaying()) return;
    this.isSnakePlaying.set(true);
    this.snakeInterval = setInterval(() => this.updateSnake(), 150);
  }

  stopSnake() {
    clearInterval(this.snakeInterval);
    this.isSnakePlaying.set(false);
  }

  updateSnake() {
    this.directionLocked.set(false);
    const head = this.snake()[0];
    const newHead = { x: head.x + this.direction().x, y: head.y + this.direction().y };

    if (newHead.x < 0) newHead.x = 19;
    if (newHead.x > 19) newHead.x = 0;
    if (newHead.y < 0) newHead.y = 19;
    if (newHead.y > 19) newHead.y = 0;

    if (this.snake().some(s => s.x === newHead.x && s.y === newHead.y)) {
      this.snake.set([{ x: 5, y: 5 }]);
      this.direction.set({ x: 1, y: 0 });
      return;
    }

    const newSnake = [newHead, ...this.snake()];

    if (newHead.x === this.food().x && newHead.y === this.food().y) {
      this.spawnFood(newSnake);
    } else {
      newSnake.pop();
    }
    this.snake.set(newSnake);
  }

  changeSnakeDirection(dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') {
    if (this.directionLocked()) return;
    const current = this.direction();
    let changed = false;
    switch (dir) {
      case 'UP': if (current.y !== 1) { this.direction.set({ x: 0, y: -1 }); changed = true; } break;
      case 'DOWN': if (current.y !== -1) { this.direction.set({ x: 0, y: 1 }); changed = true; } break;
      case 'LEFT': if (current.x !== 1) { this.direction.set({ x: -1, y: 0 }); changed = true; } break;
      case 'RIGHT': if (current.x !== -1) { this.direction.set({ x: 1, y: 0 }); changed = true; } break;
    }
    if (changed) this.directionLocked.set(true);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.activeWindowId() === 'snake') {
      if (event.key === 'ArrowUp') this.changeSnakeDirection('UP');
      if (event.key === 'ArrowDown') this.changeSnakeDirection('DOWN');
      if (event.key === 'ArrowLeft') this.changeSnakeDirection('LEFT');
      if (event.key === 'ArrowRight') this.changeSnakeDirection('RIGHT');
    }
  }

  isSnakeHead(x: number, y: number): boolean {
    const head = this.snake()[0];
    return head.x === x && head.y === y;
  }

  isSnakeBody(x: number, y: number): boolean {
    return this.snake().slice(1).some(s => s.x === x && s.y === y);
  }

  isFood(x: number, y: number): boolean {
    return this.food().x === x && this.food().y === y;
  }

  spawnFood(snakeBody: { x: number, y: number }[]): void {
    let newFood: { x: number, y: number };
    do {
      newFood = {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 20)
      };
    } while (snakeBody.some(s => s.x === newFood.x && s.y === newFood.y));
    this.food.set(newFood);
  }


  initWebGL(): void {
    const canvas = this.elementRef.nativeElement.querySelector('#bg-canvas');
    if (!canvas) return;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const particleCount = 15000;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 25;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xf472b6,
      size: 0.05,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);

    this.camera.position.z = 20;
    this.animateWebGL();
  }

  animateWebGL = () => {
    this.animationFrameId = requestAnimationFrame(this.animateWebGL);
    const elapsedTime = this.clock.getElapsedTime();

    const targetRotationX = this.mousePosition().y * 0.5;
    const targetRotationY = this.mousePosition().x * 0.5;

    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(elapsedTime * 2 + positions[i] * 0.5) * 0.002;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;

      this.particles.rotation.x += (targetRotationX - this.particles.rotation.x) * 0.02;
      this.particles.rotation.y += (targetRotationY - this.particles.rotation.y) * 0.02;
      this.particles.rotation.z += 0.002;

      this.particles.material.size = 0.06 + Math.sin(elapsedTime * 3) * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event: MouseEvent) {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.mousePosition.set({ x, y });
  }

  startCMatrixAnimation(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}';
    const fontSize = 16;
    let columns = 0;
    let drops: number[] = [];

    const setupState = () => {
      const newWidth = canvas.offsetWidth;
      const newHeight = canvas.offsetHeight;

      if (newWidth === 0 || newHeight === 0) return;

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;

        const newColumns = Math.floor(canvas.width / fontSize);
        if (newColumns !== columns) {
          const oldColumns = columns;
          columns = newColumns;
          if (columns > oldColumns) {
            for (let i = oldColumns; i < columns; i++) {
              drops[i] = Math.floor(Math.random() * canvas.height / fontSize);
            }
          } else {
            drops.length = columns;
          }
        }
      }
    };

    const draw = () => {
      if (!ctx || canvas.width === 0 || canvas.height === 0) return;
      ctx.fillStyle = 'rgba(10, 5, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f472b6'; // pink
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    setTimeout(() => {
      requestAnimationFrame(() => {
        setupState();
        if (!this.cmatrixIntervalId()) {
          const interval = setInterval(draw, 33);
          this.cmatrixIntervalId.set(interval);
        }
      });
    }, 50);

    if (this.cmatrixObserver) {
      this.cmatrixObserver.disconnect();
    }
    this.cmatrixObserver = new ResizeObserver(() => {
      requestAnimationFrame(setupState);
    });
    this.cmatrixObserver.observe(canvas);
  }

  skills: Skill[] = [
    { name: 'C', icon: 'https://svgl.app/library/c.svg' },
    { name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg' },
    { name: 'Assembly', icon: 'https://svgl.app/library/linux.svg' },
    { name: 'Lua', icon: 'https://svgl.app/library/lua.svg' },
    { name: 'Java', icon: 'https://svgl.app/library/java.svg' },
    { name: 'Kotlin', icon: 'https://svgl.app/library/kotlin.svg' },
    { name: 'JavaScript', icon: 'https://svgl.app/library/javascript.svg' },
    { name: 'TypeScript', icon: 'https://svgl.app/library/typescript.svg' },
    { name: 'Go', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg' },
    { name: 'Python', icon: 'https://svgl.app/library/python.svg' },
    { name: 'Linux', icon: 'https://svgl.app/library/linux.svg' },
    { name: 'Bash', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg' },
    { name: 'Git', icon: 'https://svgl.app/library/git.svg' },
    { name: 'Docker', icon: 'https://svgl.app/library/docker.svg' },
    { name: 'GitHub', icon: 'https://svgl.app/library/github_dark.svg' },
    { name: 'CI/CD', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/githubactions/githubactions-original.svg' },
    { name: 'Node.js', icon: 'https://svgl.app/library/nodejs.svg' },
    { name: 'PostgreSQL', icon: 'https://svgl.app/library/postgresql.svg' },
    { name: 'MongoDB', icon: 'https://svgl.app/library/mongodb-icon-dark.svg' },
    { name: 'AWS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
    { name: 'Lambda', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
    { name: 'S3', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
    { name: 'EC2', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
    { name: 'DynamoDB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dynamodb/dynamodb-original.svg' },
    { name: 'CloudWatch', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
    { name: 'API Gateway', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
    { name: 'RDS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
    { name: 'Ghidra', icon: 'https://svgl.app/library/linux.svg' },
    { name: 'x64dbg', icon: 'https://svgl.app/library/linux.svg' },
  ];

  getSafeIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }
  projects: Project[] = [
    {
      title: 'Projekt-Redware',
      type: { pt: 'Aplicação P2P / Chat Seguro', en: 'P2P App / Secure Chat' },
      descPt: 'Chat P2P focado em privacidade. Backend em Go e frontend em Svelte/Wails.',
      descEn: 'Privacy-focused P2P chat. Go backend and Svelte/Wails frontend.',
      tech: ['Go', 'Svelte', 'Wails', 'TypeScript', 'Docker'],
      url: 'https://github.com/theKerosen/projekt-redware'
    },
    {
      title: 'AstraNet',
      type: { pt: 'Monitoramento / Steam', en: 'Monitoring / Steam' },
      descPt: 'Monitoramento em tempo real para Steam (CS2). Python + Discord Webhooks.',
      descEn: 'Real-time monitoring for Steam (CS2). Python + Discord Webhooks.',
      tech: ['Python', 'SteamCMD CLI', 'Discord Webhooks'],
      url: 'https://github.com/theKerosen/AstraNet'
    },
    {
      title: 'Nyxia',
      type: { pt: 'Biblioteca / API Wrapper', en: 'Library / API Wrapper' },
      descPt: 'Wrapper de API do Discord em Java. Foco em POO e bots robustos.',
      descEn: 'Discord API wrapper in Java. Focus on OOP and robust bots.',
      tech: ['Java', 'HTTP/WebSocket'],
      url: 'https://github.com/theKerosen/Nyxia'
    },
    {
      title: 'DesyncPlugin',
      type: { pt: 'Plugin Minecraft', en: 'Minecraft Plugin' },
      descPt: 'Plugin que manipula pacotes de rede para alterar mecânicas de movimento.',
      descEn: 'Plugin that manipulates network packets to alter movement mechanics.',
      tech: ['Java', 'Spigot/Bukkit API', 'Packet Handling'],
      url: 'https://github.com/theKerosen/DesyncPlugin'
    },
    {
      title: 'nyowzers-lib',
      type: { pt: 'Biblioteca de Utilidades', en: 'Utility Library' },
      descPt: 'Utilitários JS/Node.js seguindo a filosofia DRY.',
      descEn: 'JS/Node.js utilities following the DRY philosophy.',
      tech: ['JavaScript', 'Node.js'],
      url: 'https://github.com/theKerosen/nyowzers-lib'
    },
    {
      title: 'Nodus',
      type: { pt: 'Task Engine / Automação', en: 'Task Engine / Automation' },
      descPt: 'Engine de tarefas em C com integração Lua para scripting.',
      descEn: 'Task engine in C with Lua integration for scripting.',
      tech: ['C', 'Lua'],
      url: 'https://github.com/theKerosen/Nodus'
    }
  ];
  socials: Social[] = [
    { name: 'Discord', url: 'https://discord.com/users/434360273726341160', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>` },
    { name: 'GitHub', url: 'https://github.com/theKerosen', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-github"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>` }
  ];
}