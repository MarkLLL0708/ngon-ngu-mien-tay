export type RegionKey = "bac" | "nam" | "trung" | "tay";
export type AgeGroup = "18-26" | "27-35" | "36+";

export const regions = {
  bac: { name: "Miền Bắc", short: "Bắc", city: "Hà Nội", vibe: "Nhẹ nhàng, tinh tế nhé.", cities: ["Hà Nội", "Hải Phòng", "Nam Định", "Thái Nguyên"] },
  nam: { name: "Miền Nam", short: "Nam", city: "Sài Gòn", vibe: "Thoải mái, chân chất nha.", cities: ["Sài Gòn", "Biên Hòa", "Vũng Tàu", "Bình Dương"] },
  trung: { name: "Miền Trung", short: "Trung", city: "Huế", vibe: "Dịu dàng, đậm đà nghe.", cities: ["Huế", "Đà Nẵng", "Nha Trang", "Nghệ An", "Hà Tĩnh", "Quy Nhơn"] },
  tay: { name: "Miền Tây", short: "Tây", city: "Cần Thơ", vibe: "Hiền hậu, hào sảng nghen.", cities: ["Cần Thơ", "Bến Tre", "Vĩnh Long", "An Giang"] },
} satisfies Record<RegionKey, { name: string; short: string; city: string; vibe: string; cities: string[] }>;

export type Persona = { id: string; region: RegionKey; name: string; age: number; city: string; job: string; tags: string[]; blurb: string };
export const personas: Persona[] = [
  { id: "thao", region: "bac", name: "Thảo", age: 24, city: "Hà Nội", job: "Thiết kế", tags: ["tinh tế", "cà phê", "phố cổ"], blurb: "Tinh tế, hay cà phê phố cổ" },
  { id: "hang", region: "bac", name: "Hằng", age: 27, city: "Hà Nội", job: "Ngân hàng", tags: ["chín chắn", "duyên ngầm", "điềm tĩnh"], blurb: "Chín chắn, duyên ngầm" },
  { id: "lan", region: "bac", name: "Lan", age: 23, city: "Hải Phòng", job: "Sinh viên", tags: ["thẳng tính", "dễ thương", "tươi vui"], blurb: "Thẳng tính, dễ thương" },
  { id: "tram", region: "nam", name: "Trâm", age: 23, city: "Sài Gòn", job: "Marketing", tags: ["năng động", "trà sữa", "rooftop"], blurb: "Năng động, mê trà sữa và rooftop" },
  { id: "vy", region: "nam", name: "Vy", age: 26, city: "Sài Gòn", job: "Kế toán", tags: ["hài hước", "hay trêu", "tinh ý"], blurb: "Hài hước, hay trêu" },
  { id: "nhi", region: "nam", name: "Nhi", age: 22, city: "Vũng Tàu", job: "Phục vụ quán cà phê", tags: ["hiền", "thích biển", "ấm áp"], blurb: "Hiền, thích biển" },
  { id: "ngoc", region: "trung", name: "Ngọc", age: 25, city: "Huế", job: "Giáo viên", tags: ["dịu dàng", "e ấp", "sâu sắc"], blurb: "Dịu dàng, e ấp" },
  { id: "my", region: "trung", name: "My", age: 24, city: "Đà Nẵng", job: "Hướng dẫn viên", tags: ["thẳng", "vui", "hay đi phượt"], blurb: "Thẳng, vui, hay đi phượt" },
  { id: "mai", region: "tay", name: "Mai", age: 22, city: "Cần Thơ", job: "Sinh viên", tags: ["hiền", "hào sảng", "thân thiện"], blurb: "Hiền, hào sảng" },
  { id: "ut", region: "tay", name: "Út", age: 24, city: "Bến Tre", job: "Chủ shop online", tags: ["vui tính", "dễ thương", "ấm áp"], blurb: "Vui tính, nói chuyện dễ thương" },
];
