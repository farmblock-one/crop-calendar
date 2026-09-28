import type { CropProfile, TaskType } from '../types'

// Sample process library. Durations and tasks are typical reference values for
// Vietnamese growing regions; engineers adjust them per plot in the app.

export const TASK_TYPES: Record<TaskType, { label: string; icon: string; color: string }> = {
  water: { label: 'Tưới nước', icon: '💧', color: '#2f80ed' },
  fertilize: { label: 'Bón phân', icon: '🧪', color: '#b7791f' },
  prune: { label: 'Tỉa cành', icon: '✂️', color: '#6b8e23' },
  pest: { label: 'Sâu bệnh', icon: '🐛', color: '#c0392b' },
  harvest: { label: 'Thu hoạch', icon: '🧺', color: '#8e44ad' },
  other: { label: 'Khác', icon: '📋', color: '#5f6b7a' },
}

export const BUILT_IN_CROPS: CropProfile[] = [
  {
    id: 'durian',
    name: 'Sầu riêng',
    emoji: '🍈',
    variety: 'Ri6 / Monthong',
    climate: 'Nam Bộ, Tây Nguyên',
    description:
      'Chu kỳ canh tác 1 năm cho cây đang cho trái, bắt đầu ngay sau vụ thu hoạch trước. Ngày bắt đầu = ngày kết thúc thu hoạch vụ trước.',
    perennial: true,
    builtIn: true,
    stages: [
      {
        id: 'du-recover',
        name: 'Phục hồi sau thu hoạch',
        days: 45,
        color: '#7fb77e',
        description: 'Vệ sinh vườn, cắt tỉa, bón phân phục hồi bộ rễ và tán lá.',
        tasks: [
          { id: 'du-r-prune', title: 'Tỉa cành vệ sinh, cắt cành sâu bệnh', type: 'prune', offsetDay: 2 },
          { id: 'du-r-fert1', title: 'Bón phân hữu cơ + NPK cao đạm phục hồi', type: 'fertilize', offsetDay: 5 },
          { id: 'du-r-fert2', title: 'Bón NPK 20-20-15 lần 2', type: 'fertilize', offsetDay: 30 },
          { id: 'du-r-water', title: 'Tưới giữ ẩm gốc', type: 'water', offsetDay: 0, repeatEvery: 3 },
          { id: 'du-r-pest', title: 'Kiểm tra nấm Phytophthora gốc, thân', type: 'pest', offsetDay: 7, repeatEvery: 10 },
        ],
      },
      {
        id: 'du-flush',
        name: 'Nuôi cơi đọt',
        days: 75,
        color: '#4caf7a',
        description: 'Ra 2 cơi đọt, tán lá già đều để chuẩn bị xử lý ra hoa.',
        tasks: [
          { id: 'du-f-foliar', title: 'Phun phân bón lá hỗ trợ ra đọt', type: 'fertilize', offsetDay: 5, repeatEvery: 15 },
          { id: 'du-f-fert', title: 'Bón NPK nuôi cơi đọt 2', type: 'fertilize', offsetDay: 35 },
          { id: 'du-f-water', title: 'Tưới nước', type: 'water', offsetDay: 0, repeatEvery: 4 },
          { id: 'du-f-pest', title: 'Kiểm tra rầy phấn, bọ trĩ trên đọt non', type: 'pest', offsetDay: 3, repeatEvery: 7 },
          { id: 'du-f-prune', title: 'Tỉa cành tạo tán, cành trong tán', type: 'prune', offsetDay: 50 },
        ],
      },
      {
        id: 'du-induce',
        name: 'Xử lý ra hoa',
        days: 40,
        color: '#e0b04a',
        description: 'Siết nước, bón lân – kali để phân hóa mầm hoa.',
        tasks: [
          { id: 'du-i-fert', title: 'Bón phân lân – kali cao (NPK 10-40-20)', type: 'fertilize', offsetDay: 0 },
          { id: 'du-i-dry', title: 'Ngưng tưới, phủ bạt siết nước (theo KS)', type: 'water', offsetDay: 3 },
          { id: 'du-i-check', title: 'Kiểm tra mầm hoa (mắt cua)', type: 'other', offsetDay: 20, repeatEvery: 5 },
          { id: 'du-i-pest', title: 'Kiểm tra sâu bệnh trên tán', type: 'pest', offsetDay: 7, repeatEvery: 10 },
        ],
      },
      {
        id: 'du-flower',
        name: 'Ra hoa – đậu trái',
        days: 50,
        color: '#f29d52',
        description: 'Tưới lại từ từ, tỉa hoa, thụ phấn bổ sung, phòng bệnh thán thư.',
        tasks: [
          { id: 'du-fl-water', title: 'Tưới nước tăng dần', type: 'water', offsetDay: 0, repeatEvery: 3 },
          { id: 'du-fl-thin', title: 'Tỉa bớt chùm hoa, giữ hoa trên cành to', type: 'prune', offsetDay: 15 },
          { id: 'du-fl-poll', title: 'Thụ phấn bổ sung buổi tối', type: 'other', offsetDay: 35 },
          { id: 'du-fl-pest', title: 'Phòng thán thư, bọ trĩ trên hoa', type: 'pest', offsetDay: 5, repeatEvery: 7 },
          { id: 'du-fl-foliar', title: 'Phun canxi – bo giúp đậu trái', type: 'fertilize', offsetDay: 25 },
        ],
      },
      {
        id: 'du-fruit',
        name: 'Nuôi trái',
        days: 110,
        color: '#d9774a',
        description: 'Tỉa trái, bón nuôi trái, chống rụng và sượng cơm.',
        tasks: [
          { id: 'du-fr-thin', title: 'Tỉa trái méo, trái non dư', type: 'prune', offsetDay: 10 },
          { id: 'du-fr-thin2', title: 'Tỉa trái lần 2, cột/treo trái', type: 'prune', offsetDay: 40 },
          { id: 'du-fr-fert', title: 'Bón NPK nuôi trái', type: 'fertilize', offsetDay: 15, repeatEvery: 30 },
          { id: 'du-fr-water', title: 'Tưới nước đều, tránh sốc nước', type: 'water', offsetDay: 0, repeatEvery: 3 },
          { id: 'du-fr-pest', title: 'Kiểm tra sâu đục trái, rệp sáp', type: 'pest', offsetDay: 5, repeatEvery: 7 },
        ],
      },
      {
        id: 'du-harvest',
        name: 'Thu hoạch',
        days: 45,
        color: '#9b59b6',
        description: 'Thu hoạch theo đợt khi trái đủ tuổi (~95–110 ngày sau đậu trái).',
        tasks: [
          { id: 'du-h-check', title: 'Kiểm tra độ chín, đánh dấu trái', type: 'harvest', offsetDay: 0, repeatEvery: 5 },
          { id: 'du-h-cut', title: 'Thu hoạch đợt', type: 'harvest', offsetDay: 5, repeatEvery: 10 },
          { id: 'du-h-water', title: 'Tưới nhẹ giữ ẩm', type: 'water', offsetDay: 1, repeatEvery: 5 },
        ],
      },
    ],
  },
  {
    id: 'coffee',
    name: 'Cà phê Robusta',
    emoji: '☕',
    variety: 'TR4 / TRS1',
    climate: 'Tây Nguyên',
    description:
      'Chu kỳ 1 năm cho vườn cà phê kinh doanh, bắt đầu sau khi thu hái xong (khoảng tháng 12 – tháng 1).',
    perennial: true,
    builtIn: true,
    stages: [
      {
        id: 'cf-post',
        name: 'Sau thu hoạch – tỉa cành',
        days: 30,
        color: '#7fb77e',
        description: 'Cắt tỉa cành già, cành sâu bệnh, vệ sinh vườn.',
        tasks: [
          { id: 'cf-p-prune', title: 'Tỉa cành sau thu hoạch', type: 'prune', offsetDay: 3 },
          { id: 'cf-p-clean', title: 'Vệ sinh vườn, gom cành lá bệnh', type: 'other', offsetDay: 10 },
          { id: 'cf-p-org', title: 'Bón phân hữu cơ hoai mục', type: 'fertilize', offsetDay: 15 },
          { id: 'cf-p-pest', title: 'Kiểm tra rệp sáp, mọt đục cành', type: 'pest', offsetDay: 5, repeatEvery: 10 },
        ],
      },
      {
        id: 'cf-bloom',
        name: 'Tưới nước ra hoa (mùa khô)',
        days: 75,
        color: '#e0b04a',
        description: 'Tưới đợt 1 khi mầm hoa phát triển đủ, các đợt sau cách 20–25 ngày.',
        tasks: [
          { id: 'cf-b-water', title: 'Tưới đợt (400–500 lít/gốc)', type: 'water', offsetDay: 5, repeatEvery: 22 },
          { id: 'cf-b-fert', title: 'Bón phân mùa khô (SA + NPK)', type: 'fertilize', offsetDay: 6 },
          { id: 'cf-b-pest', title: 'Kiểm tra rệp sáp, rệp vảy xanh', type: 'pest', offsetDay: 10, repeatEvery: 14 },
        ],
      },
      {
        id: 'cf-set',
        name: 'Đậu quả – quả non',
        days: 60,
        color: '#4caf7a',
        description: 'Đầu mùa mưa, quả non phát triển nhanh, cần dinh dưỡng.',
        tasks: [
          { id: 'cf-s-fert', title: 'Bón phân đợt 1 mùa mưa (NPK 16-8-16)', type: 'fertilize', offsetDay: 5 },
          { id: 'cf-s-sucker', title: 'Tỉa chồi vượt', type: 'prune', offsetDay: 7, repeatEvery: 20 },
          { id: 'cf-s-weed', title: 'Làm cỏ quanh gốc', type: 'other', offsetDay: 20 },
          { id: 'cf-s-pest', title: 'Kiểm tra bệnh gỉ sắt, khô cành khô quả', type: 'pest', offsetDay: 3, repeatEvery: 10 },
        ],
      },
      {
        id: 'cf-grow',
        name: 'Phát triển quả',
        days: 120,
        color: '#2e8b57',
        description: 'Giữa mùa mưa, quả lớn và tích lũy chất khô.',
        tasks: [
          { id: 'cf-g-fert', title: 'Bón phân đợt 2 và 3 mùa mưa', type: 'fertilize', offsetDay: 10, repeatEvery: 50 },
          { id: 'cf-g-sucker', title: 'Tỉa chồi vượt', type: 'prune', offsetDay: 5, repeatEvery: 20 },
          { id: 'cf-g-drain', title: 'Khơi rãnh thoát nước', type: 'water', offsetDay: 15 },
          { id: 'cf-g-pest', title: 'Kiểm tra gỉ sắt, thán thư, rệp sáp', type: 'pest', offsetDay: 3, repeatEvery: 10 },
        ],
      },
      {
        id: 'cf-harvest',
        name: 'Chín – thu hái',
        days: 80,
        color: '#9b59b6',
        description: 'Thu hái khi tỉ lệ quả chín trên 90%, phơi sấy kịp thời.',
        tasks: [
          { id: 'cf-h-check', title: 'Kiểm tra tỷ lệ quả chín', type: 'harvest', offsetDay: 30, repeatEvery: 7 },
          { id: 'cf-h-pick', title: 'Thu hái đợt', type: 'harvest', offsetDay: 50, repeatEvery: 10 },
          { id: 'cf-h-dry', title: 'Chuẩn bị sân phơi / máy sấy', type: 'other', offsetDay: 40 },
        ],
      },
    ],
  },
  {
    id: 'rice',
    name: 'Lúa',
    emoji: '🌾',
    variety: 'OM18 / ĐS1 (100 ngày)',
    climate: 'Đồng bằng sông Cửu Long',
    description: 'Vụ lúa ngắn ngày ~100 ngày, tính từ ngày gieo sạ.',
    perennial: false,
    builtIn: true,
    stages: [
      {
        id: 'ri-sow',
        name: 'Làm đất – gieo sạ',
        days: 7,
        color: '#a1887f',
        description: 'Chuẩn bị đất, bón lót, gieo sạ.',
        tasks: [
          { id: 'ri-s-base', title: 'Bón lót (lân + hữu cơ)', type: 'fertilize', offsetDay: 0 },
          { id: 'ri-s-snail', title: 'Kiểm tra ốc bươu vàng', type: 'pest', offsetDay: 3 },
          { id: 'ri-s-water', title: 'Giữ ruộng ráo, đánh rãnh thoát nước', type: 'water', offsetDay: 1 },
        ],
      },
      {
        id: 'ri-till',
        name: 'Mạ – đẻ nhánh',
        days: 33,
        color: '#7fb77e',
        description: 'Cây lúa đẻ nhánh, bón thúc 2 lần.',
        tasks: [
          { id: 'ri-t-fert1', title: 'Bón thúc lần 1 (7–10 NSS)', type: 'fertilize', offsetDay: 3 },
          { id: 'ri-t-fert2', title: 'Bón thúc lần 2 (18–22 NSS)', type: 'fertilize', offsetDay: 14 },
          { id: 'ri-t-water', title: 'Cho nước vào ruộng 3–5 cm', type: 'water', offsetDay: 2, repeatEvery: 7 },
          { id: 'ri-t-pest', title: 'Thăm đồng: rầy nâu, sâu cuốn lá', type: 'pest', offsetDay: 5, repeatEvery: 7 },
        ],
      },
      {
        id: 'ri-pani',
        name: 'Làm đòng',
        days: 22,
        color: '#e0b04a',
        description: 'Phân hóa đòng, rút nước giữa vụ và bón đón đòng.',
        tasks: [
          { id: 'ri-p-dry', title: 'Rút nước phơi ruộng giữa vụ', type: 'water', offsetDay: 0 },
          { id: 'ri-p-fert', title: 'Bón đón đòng (kali + đạm)', type: 'fertilize', offsetDay: 8 },
          { id: 'ri-p-water', title: 'Cho nước trở lại 5 cm', type: 'water', offsetDay: 7 },
          { id: 'ri-p-pest', title: 'Kiểm tra đạo ôn lá, khô vằn', type: 'pest', offsetDay: 3, repeatEvery: 7 },
        ],
      },
      {
        id: 'ri-head',
        name: 'Trổ – chín sữa',
        days: 20,
        color: '#f29d52',
        description: 'Lúa trổ bông và vào chắc.',
        tasks: [
          { id: 'ri-h-spray', title: 'Phun phòng bệnh trước/sau trổ', type: 'pest', offsetDay: 1 },
          { id: 'ri-h-water', title: 'Giữ mực nước ổn định', type: 'water', offsetDay: 0, repeatEvery: 5 },
          { id: 'ri-h-pest', title: 'Thăm đồng: bọ xít, lem lép hạt', type: 'pest', offsetDay: 8, repeatEvery: 7 },
        ],
      },
      {
        id: 'ri-ripe',
        name: 'Chín – thu hoạch',
        days: 18,
        color: '#9b59b6',
        description: 'Rút nước trước thu hoạch, thu hoạch khi 85–90% hạt chín.',
        tasks: [
          { id: 'ri-r-drain', title: 'Rút cạn nước ruộng', type: 'water', offsetDay: 5 },
          { id: 'ri-r-book', title: 'Đặt máy gặt, liên hệ thương lái', type: 'other', offsetDay: 8 },
          { id: 'ri-r-cut', title: 'Thu hoạch', type: 'harvest', offsetDay: 15 },
        ],
      },
    ],
  },
]

export const STAGE_COLORS = ['#7fb77e', '#4caf7a', '#2e8b57', '#e0b04a', '#f29d52', '#d9774a', '#9b59b6', '#a1887f', '#5dade2']
