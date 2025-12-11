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

  cmatrixCanvas = viewChild<NgElementRef<HTMLCanvasElement>>('cmatrixCanvas');
  cmatrixIntervalId = signal<any>(null);
  private cmatrixObserver: ResizeObserver | null = null;

  windows = signal<{ [key: string]: WindowState }>({
    'about': { id: 'about', title: '~/about.md', isOpen: true, order: 0, x: 50, y: 50, w: 500, h: 350, zIndex: 1 },
    'projects': { id: 'projects', title: '~/projects', isOpen: true, order: 1, x: 580, y: 50, w: 500, h: 400, zIndex: 2 },
    'fetch': { id: 'fetch', title: 'fetch', isOpen: true, order: 2, x: 100, y: 420, w: 550, h: 280, zIndex: 3 },
    'skills': { id: 'skills', title: './list-skills.sh', isOpen: true, order: 3, x: 680, y: 470, w: 400, h: 250, zIndex: 4 },
    'contact': { id: 'contact', title: '/etc/contact', isOpen: true, order: 4, x: 300, y: 200, w: 380, h: 320, zIndex: 5 },
    'snake': { id: 'snake', title: './snake_game', isOpen: false, order: 5, x: 200, y: 100, w: 400, h: 480, zIndex: 6 },
    'htop': { id: 'htop', title: 'htop', isOpen: false, order: 6, x: 650, y: 150, w: 350, h: 350, zIndex: 7 },
    'cmatrix': { id: 'cmatrix', title: 'cmatrix', isOpen: false, order: 7, x: 400, y: 250, w: 450, h: 350, zIndex: 8 },
    'steam': { id: 'steam', title: 'astranet --cs2', isOpen: false, order: 8, x: 300, y: 150, w: 480, h: 400, zIndex: 9 },
  });
  activeWindowId = signal<string | null>('about');
  maxZIndex = signal(10);

  gap = signal(8);

  openWindows = computed(() => {
    return Object.values(this.windows()).filter((w: WindowState) => w.isOpen).sort((a: WindowState, b: WindowState) => a.order - b.order);
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
    this.fetchSteamData();
    setInterval(() => this.fetchSteamData(), 30000);
  }

  async fetchSteamData(): Promise<void> {
    try {
      this.steamLoading.set(true);
      this.steamError.set(null);

      const [statusRes, newsRes, serversRes] = await Promise.all([
        fetch('https://api.ladyluh.dev/steam/status'),
        fetch('https://api.ladyluh.dev/steam/news'),
        fetch('https://api.ladyluh.dev/steam/servers')
      ]);

      if (!statusRes.ok) throw new Error('API offline');

      const statusData = await statusRes.json();
      this.steamData.set(statusData);

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        this.steamNews.set(newsData.news || []);
      }

      if (serversRes.ok) {
        const serversData = await serversRes.json();
        this.serverStatus.set(serversData);
      } else {
        this.serverStatus.set({
          steam: statusData.player_count > 0 ? 'online' : 'unknown',
          cs2: statusData.player_count > 0 ? 'online' : 'unknown',
          matchmaking: statusData.player_count > 100000 ? 'normal' : 'low'
        });
      }
    } catch (err: any) {
      this.steamError.set(err.message || 'Falha ao conectar');
      this.serverStatus.set({ steam: 'unknown', cs2: 'unknown', matchmaking: 'unknown' });
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