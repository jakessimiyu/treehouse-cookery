// EDIT ALL OF THIS with your real details
export const BRAND={name:'Treehouse Cookery',open:12,close:19,hoursText:'Mon to Fri, 12pm to 7pm',
 address:'Metropolitan Estate, Chiromo, Nairobi',mapQuery:'Treehouse Nairobi',maps:'https://maps.app.goo.gl/nLC1UCkfrKHVvrxw7?g_st=ic',
 phone:'+254720752762',wa:'254720752762',email:'inquiries@treehouse.com'};
// Index 0 = Sunday ... 6 = Saturday. [openHour, closeHour] in 24h time, or null if closed.
export const HOURS:([number,number]|null)[]=[null,[12,19],[12,19],[12,19],[12,19],[12,19],null];
// EDIT: how to reach you
export const GETTING_HERE:[string,string][]=[
 ['By matatu or bus','Tell customers the nearest stage and the route numbers that stop closest to you.'],
 ['Taxi or ride-hailing','Give a landmark to use as the drop-off point, like a well-known building or junction.'],
 ['Driving','Explain the approach road and any one-way streets or tricky turns.'],
 ['Parking','Say where customers can park, whether it is free, and how many spaces there are.']];
export const GOOD_TO_KNOW: [string, string][] = [
  [
    'Do I need a reservation?',
    'Walk-ins are welcome. For larger groups, we recommend reserving ahead to secure your table.',
  ],
  [
    'Can I order online?',
    'Yes. Browse the menu, place your order, pay via M-Pesa, and pick it up when it’s ready.',
  ],
  [
    'How long does an order take?',
    'Most orders are prepared quickly. Your order status will update once it’s being prepared and when it’s ready.',
  ],
  [
    'Do you accept M-Pesa?',
    'Yes. We accept M-Pesa for online orders, making checkout quick and convenient.',
  ],
  [
    'Can I order for a group?',
    'Absolutely. For team lunches, events, or larger orders, our catering service can help.',
  ],
  [
    'Do you offer takeaway?',
    'Yes. Place your order online or at the restaurant and enjoy your meal wherever you are.',
  ],
];