// EDIT: the words are placeholders. "type" must match a name in EVENT_TYPES (lib/catering.ts); "pkg" must match a package id.
export type Occ={id:string;title:string;type:string;pkg:string;size:string;line:string;desc:string;bring:string[];img:string;emoji:string};
export const OCC:Occ[]=[
 {id:'corporate',title:'Corporate lunches',type:'Corporate lunch',pkg:'lunch-box',size:'10 to 100',img:'corporate',emoji:'💼',
  line:'Lunch that ends the 1pm slump.',desc:'Team lunches, training days and client meetings. Boxed or served, always on time.',
  bring:['Individually packed and labelled','Dietary needs planned ahead','Delivered hot, to the minute']},
 {id:'conference',title:'Conferences & launches',type:'Conference',pkg:'platter',size:'50 to 300',img:'conference',emoji:'🎤',
  line:'Keep the room full and talking.',desc:'Food that keeps people in the room and talking, with easy grab-and-go service between sessions.',
  bring:['Shareable platters and finger food','Coffee and drinks stations','Setup and clear-down included']},
 {id:'wedding',title:'Weddings & receptions',type:'Wedding',pkg:'spread',size:'80 to 400',img:'wedding',emoji:'💍',
  line:'Fed properly, first guest to last.',desc:'Engagement parties, receptions and send-offs, with a proper hot buffet and a team that serves it.',
  bring:['Full hot buffet with serving staff','Dessert and drinks options','One coordinator from quote to clear-down']},
 {id:'birthday',title:'Birthdays & family days',type:'Birthday',pkg:'platter',size:'15 to 80',img:'birthday',emoji:'🎂',
  line:'Everyone eats. You enjoy the party.',desc:'Milestones and reunions, without the host being stuck in the kitchen.',
  bring:['Big shared platters','Kid-friendly options','Cake table space and plates']},
 {id:'graduation',title:'Graduations & school events',type:'Graduation',pkg:'spread',size:'40 to 300',img:'graduation',emoji:'🎓',
  line:'Big tables, big appetites.',desc:'A menu that works for grandparents and cousins alike, served in one smooth wave.',
  bring:['Halal and vegetarian options','Fast service for large groups','Disposable or full crockery']},
 {id:'bulk',title:'Bulk orders',type:'Bulk order',pkg:'lunch-box',size:'20 to 500',img:'bulk',emoji:'📦',
  line:'Need 40 wraps by noon? Done.',desc:'Tell us the number and the time. We handle the rest, from a single order to a standing weekly one.',
  bring:['Pick-up or delivery','Packed to travel well','Repeat orders made easy']}];