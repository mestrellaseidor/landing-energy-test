const vw = (px) => px;

// --------------------
// CHARTS
// --------------------
const insightChart = {
  type: 'bar',
  titleKey: 'chart.title',
  axisXKey: 'chart.axis_x',
  axisYKey: 'chart.axis_y',
  bars: [
    { label: 'chart.bars.rutina', pct: 18, color: '#FA3354' },
    { label: 'chart.bars.cuidado', pct: 16, color: '#FA3354' },
    { label: 'chart.bars.calma', pct: 12, color: '#FA3354' },
    { label: 'chart.bars.escape', pct: 10, color: '#FA3354' },
    { label: 'chart.bars.trabajo', pct: 8, color: '#FA3354' },
  ],
  xMax: 20,
  xTicks: [2, 4, 6, 8, 10, 12, 14, 16, 18],
};

const bubbleChart = {
  type: 'bubble',
  titleKey: 'bubble_chart.title',
  bubbles: [
    {
      label: 'bubble_chart.bubbles.basic_need', pct: 33.4, color: '#FA3354', x: 19, y: 50,
    },
    {
      label: 'bubble_chart.bubbles.desire', pct: 23, color: '#FA3354', x: 58, y: 27,
    },
    {
      label: 'bubble_chart.bubbles.social_need', pct: 24, color: '#FA3354', x: 81, y: 54,
    },
    {
      label: 'bubble_chart.bubbles.rooted_habit', pct: 16, color: '#FA3354', x: 45, y: 73,
    },
    {
      label: 'bubble_chart.bubbles.tradition', pct: 6, color: '#FA3354', x: 37, y: 43,
    },
    {
      label: 'bubble_chart.bubbles.emotion', pct: 8, color: '#FA3354', x: 63, y: 63,
    },
  ],
};

// --------------------
// CARDS
// --------------------
const insightCards = [
  {
    src: '/assets/videos/palomitas.mp4',
    width: vw(420),
    height: vw(280),
    delay: 600,
    depth: 1,
    parallaxFactor: 0.4,
    zoom: 2,
    chart: insightChart,
    x: 20,
    y: 60,
    mobileY: 22,
  },
  {
    src: '/assets/videos/cafetera.mp4',
    width: vw(360),
    height: vw(420),
    delay: 800,
    depth: 1,
    parallaxFactor: 0.7,
    zoom: 2,
    chart: insightChart,
    x: 60,
    y: 55,
    mobileY: 50,
  },
  {
    src: '/assets/videos/lamparita.mp4',
    width: vw(420),
    height: vw(280),
    delay: 1000,
    depth: 1,
    parallaxFactor: 1.0,
    zoom: 2,
    chart: bubbleChart,
    x: 80,
    y: 50,
    mobileY: 78,
  },
];

// --------------------
// PROFILES
// --------------------
const energeticProfiles = [
  { nameKey: 'profiles.cards.0.name', pct: 55.9, icon: '/assets/icons/icon-profile-digital.svg' },
  { nameKey: 'profiles.cards.1.name', pct: 21.2, icon: '/assets/icons/icon-profile-healthy.svg' },
  { nameKey: 'profiles.cards.2.name', pct: 9.64, icon: '/assets/icons/icon-profile-comfort.svg' },
  { nameKey: 'profiles.cards.3.name', pct: 7.47, icon: '/assets/icons/icon-profile-rocket.svg' },
  { nameKey: 'profiles.cards.4.name', pct: 4.82, icon: '/assets/icons/icon-profile-family.svg' },
  { nameKey: 'profiles.cards.5.name', pct: 0.96, icon: '/assets/icons/icon-profile-free.svg' },
];

// --------------------
// STEPS
// --------------------
// eslint-disable-next-line import/prefer-default-export
export const stepsJSON = [
  {
    anchor: 'step-0',
    title: 'Intro',
    slides: [
      {
        formation: 'offscreen',
        components: [
          {
            type: 'TextOverlay',
            props: {
              texts: [
                {
                  text: 'steps.0.slides.0.0', animationIn: 'zoom', animationOut: 'zoom', textSize: 80, delay: 100,
                },
                {
                  text: 'steps.0.slides.0.1', animationIn: 'zoom', animationOut: 'zoom', textSize: 80, delay: 200,
                },
              ],
            },
          },
        ],
      },
      {
        formation: 'chaos',
        components: [
          {
            type: 'TextOverlay',
            props: {
              texts: [
                {
                  text: 'steps.0.slides.1.0', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 100,
                },
                {
                  text: 'steps.0.slides.1.1', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 200,
                },
                {
                  text: 'steps.0.slides.1.2', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 400,
                },
              ],
            },
          },
        ],
      },
      {
        formation: 'chaos',
        components: [
          {
            type: 'TextOverlay',
            props: {
              texts: [
                {
                  text: 'steps.0.slides.2.0', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 100,
                },
                {
                  text: 'steps.0.slides.2.1', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 200,
                },
              ],
            },
          },
        ],
      },
      {
        formation: 'chaos',
        components: [
          {
            type: 'TextOverlay',
            props: {
              texts: [
                {
                  text: 'steps.0.slides.3.0', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 100,
                },
                {
                  text: 'steps.0.slides.3.1', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 200,
                },
              ],
            },
          },
        ],
      },
      {
        formation: 'chaos',
        components: [
          {
            type: 'TextOverlay',
            props: {
              texts: [
                {
                  text: 'steps.0.slides.4.0', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 100,
                },
                {
                  text: 'steps.0.slides.4.1', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 200,
                },
              ],
            },
          },
        ],
      },
      {
        formation: 'chaos',
        backgroundGradient:
          'radial-gradient(81.86% 105.89% at 69.69% 132.72%, #04B0C7 0%, #00213A 79.33%)',
        components: [
          {
            type: 'TextOverlay',
            props: {
              'align-items': 'flex-start',
              texts: [
                {
                  text: 'steps.0.slides.5.0', textColor: '#FFF', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 100,
                },
                {
                  text: 'steps.0.slides.5.1', textColor: '#FFF', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 150,
                },
                {
                  text: 'steps.0.slides.5.2', textColor: '#FFF', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 200,
                },
                {
                  text: 'steps.0.slides.5.3', textColor: '#FFF', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 250,
                },
                {
                  text: 'steps.0.slides.5.4', textColor: '#FFF', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 300,
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    anchor: 'step-1',
    title: 'Insights',
    slides: [
      {
        formation: 'chaos',
        components: [
          {
            type: 'TextOverlay',
            props: {
              texts: [
                {
                  text: 'steps.1.0', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 100,
                },
                {
                  text: 'steps.1.1', animationIn: 'zoom', animationOut: 'zoom', textSize: 60, delay: 500,
                },
              ],
            },
          },
        ],
      },
      {
        formation: 'chaos',
        exitForward: 'expand',
        exitBack: 'left',
        components: [
          {
            type: 'CardOverlay',
            props: { cardState: 'cards', cards: insightCards },
          },
        ],
      },
      {
        formation: 'chaos',
        exitForward: 'expand-to:1',
        exitBack: 'contract',
        components: [
          {
            type: 'CardOverlay',
            props: { cardState: 'expanded', cards: insightCards, expandCardIndex: 0 },
          },
        ],
      },
      {
        formation: 'chaos',
        exitForward: 'expand-to:2',
        exitBack: 'expand-to:0',
        components: [
          {
            type: 'CardOverlay',
            props: { cardState: 'expanded', cards: insightCards, expandCardIndex: 1 },
          },
        ],
      },
      {
        formation: 'chaos',
        exitForward: 'fly',
        exitBack: 'expand-to:1',
        components: [
          {
            type: 'CardOverlay',
            props: { cardState: 'expanded', cards: insightCards, expandCardIndex: 2 },
          },
        ],
      },
      {
        formation: 'chaos',
        components: [
          {
            type: 'TextOverlay',
            gridRow: '3 / 9',
            props: {
              'justify-content': 'end',
              texts: [
                {
                  text: 'sphere.line1', animationIn: 'zoom', animationOut: 'zoom', textSize: 52, delay: 100,
                },
                {
                  text: 'sphere.line2', animationIn: 'zoom', animationOut: 'zoom', textSize: 52, delay: 300,
                },
                {
                  text: 'sphere.line3', animationIn: 'zoom', animationOut: 'zoom', textSize: 52, delay: 300,
                },
              ],
            },
          },
          {
            type: 'ActionOverlay',
            gridRow: '9 / 11',
            props: { labelKey: 'sphere.cta', action: 'openInsightList', delay: 1000 },
          },
        ],
      },
    ],
  },
  {
    anchor: 'step-2',
    title: 'Perfiles',
    slides: [
      {
        formation: 'chaos',
        particlesInFront: true,
        components: [
          {
            type: 'EnergeticProfiles',
            props: { profiles: energeticProfiles },
          },
        ],
      },
    ],
  },
  {
    anchor: 'step-3',
    routePath: '/data-kitchen',
    slides: [],
    title: 'Data Kitchen',
  },
  {
    anchor: 'step-4',
    routePath: '/study',
    slides: [],
    title: 'Acceso al estudio',
  },
];
