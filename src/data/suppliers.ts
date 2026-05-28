export interface Supplier {
  id: number;
  name: string;
  cat: string;
  region: string;
  spec: string;
  cert: string;
  founded: number;
  tags: string[];
}

export const SUPPLIERS: Supplier[] = [
  { id: 1,  name: 'Cytec Solvay',       cat: 'Flotation reagents',      region: 'Global',            spec: 'Xanthates, dithiophosphates, frothers, depressants for Cu/Ni/Mo flotation',           cert: 'ISO 9001',  founded: 1917, tags: ['Flotation', 'Xanthate', 'Cu/Ni/Mo'] },
  { id: 2,  name: 'Clariant Mining',    cat: 'Flotation reagents',      region: 'Global',            spec: 'Collectors, depressants, frothers across base and precious metals',                   cert: 'ISO 14001', founded: 1995, tags: ['Flotation', 'Collectors', 'Base metals'] },
  { id: 3,  name: 'Metso Outotec',      cat: 'Processing equipment',    region: 'Global',            spec: 'Flotation cells, mills, thickeners, filters, pressure oxidation systems',             cert: 'ISO 9001',  founded: 1999, tags: ['Equipment', 'Flotation cells', 'Comminution'] },
  { id: 4,  name: 'FLSmidth',           cat: 'Processing equipment',    region: 'Global',            spec: 'Full flowsheet equipment, HPGR comminution, paste thickeners',                        cert: 'ISO 14001', founded: 1882, tags: ['Equipment', 'HPGR', 'Thickeners'] },
  { id: 5,  name: 'Magotteaux',         cat: 'Grinding media',          region: 'Global',            spec: 'Cast and forged grinding balls, mill liners for AG/SAG/ball mills',                   cert: 'ISO 9001',  founded: 1920, tags: ['Grinding', 'Mill liners', 'Media'] },
  { id: 6,  name: 'Ausenco',            cat: 'Engineering contractors', region: 'Global',            spec: 'Process engineering, EPCM, copper, gold and lithium flowsheet design',                cert: 'ISO 9001',  founded: 1991, tags: ['EPCM', 'Flowsheet', 'Cu/Au/Li'] },
  { id: 7,  name: 'SRK Consulting',     cat: 'Engineering contractors', region: 'Global',            spec: 'Feasibility studies, resource estimation, metallurgical testwork, ESG',               cert: 'ISO 14001', founded: 1974, tags: ['Feasibility', 'Resources', 'ESG'] },
  { id: 8,  name: 'DRA Global',         cat: 'Engineering contractors', region: 'Africa',            spec: 'Process engineering and EPCM for base metals, platinum and gold in Africa',           cert: 'ISO 9001',  founded: 1984, tags: ['Africa', 'EPCM', 'Base metals'] },
  { id: 9,  name: 'Nouryon',            cat: 'Flotation reagents',      region: 'Europe/Americas',   spec: 'Amine collectors for oxide copper and potash flotation',                              cert: 'ISO 9001',  founded: 1994, tags: ['Flotation', 'Amine', 'Oxide Cu'] },
  { id: 10, name: 'Molycop',            cat: 'Grinding media',          region: 'Americas/Australia', spec: 'Forged grinding balls and rods for primary and secondary grinding',                   cert: 'ISO 9001',  founded: 1920, tags: ['Grinding', 'Balls', 'Rods'] },
  { id: 11, name: 'Orica Mining',       cat: 'Leaching chemicals',      region: 'Global',            spec: 'Sodium cyanide, specialty chemicals for gold CIL/CIP and heap leach operations',     cert: 'ISO 9001',  founded: 1874, tags: ['NaCN', 'Gold leach', 'CIL'] },
  { id: 12, name: 'Evonik Industries',  cat: 'Leaching chemicals',      region: 'Europe',            spec: 'Hydrogen peroxide and specialty acids for hydrometallurgical leach circuits',         cert: 'ISO 14001', founded: 1909, tags: ['H₂O₂', 'Hydromet', 'Acid leach'] },
  { id: 13, name: 'Tenova',             cat: 'Processing equipment',    region: 'Europe',            spec: 'Electric arc furnaces, smelting and refining systems for base and precious metals',   cert: 'ISO 9001',  founded: 1960, tags: ['Smelting', 'EAF', 'Refining'] },
  { id: 14, name: 'Hatch',              cat: 'Engineering contractors', region: 'Global',            spec: 'Mining, metallurgical and infrastructure engineering, EPCM across all commodities',   cert: 'ISO 9001',  founded: 1955, tags: ['EPCM', 'Infrastructure', 'Mining'] },
  { id: 15, name: 'Senmin',             cat: 'Flotation reagents',      region: 'Africa',            spec: 'Xanthate and dithiophosphate collectors for platinum group metals and base metals',   cert: 'ISO 9001',  founded: 1985, tags: ['PGM', 'Xanthate', 'Africa'] },
  { id: 16, name: 'Bradken',            cat: 'Grinding media',          region: 'Australia',         spec: 'Cast iron and steel grinding media, mill liners for comminution circuits',            cert: 'ISO 9001',  founded: 1922, tags: ['Cast iron', 'Mill liners', 'Australia'] },
  { id: 17, name: 'Wood Group',         cat: 'Engineering contractors', region: 'Global',            spec: 'Front-end engineering and EPCM for minerals processing and smelting projects',       cert: 'ISO 14001', founded: 1982, tags: ['FEED', 'EPCM', 'Smelting'] },
  { id: 18, name: 'Kemira',             cat: 'Leaching chemicals',      region: 'Europe',            spec: 'Sulfuric acid, flocculants and process water treatment chemicals for heap leach',    cert: 'ISO 14001', founded: 1920, tags: ['H₂SO₄', 'Flocculants', 'Heap leach'] },
];
