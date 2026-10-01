// 200+ of the most common English words, ordered by rough frequency.
// The harness takes a prefix of this list, so the head must be common words
// (a fair "can a normal user look this up" test) while the tail exercises
// Frequency-ordered so the head is what a user actually types.
const COMMON = `
hello goodbye world book read look word time love work play live long make help find
look see come know think take place year use give build stay follow hold begin end
able bad big black blood blue board body boy bread break bring brother buy call car
carry catch change cheap check chicken city class clean clear climb cloth cloud club
coal coast cold color come common company complete computer continue control cook cool
copy corner cost count country course court cover create cry cut dance dark date
daughter day dead dear death deep develop dictionary die difficult dinner direct dirty
discover doctor dog dollar door double down draw dream dress drink drive drop dry during
early earth east easy eat edge educate effect effort eight either electric else empty
enemy energy enjoy enough enter environment equal escape especially even evening event
ever every exact example excellent except exist expect experience explain express
extra eye face fact fail fair fall family famous farm fast father favorite fear feed feel
few field fight figure fill final find fine finger finish fire first fish five floor
fly follow food foot football for force foreign forget form four free fresh friend
from front full fun future garden general gentle gift girl give glad glass go goal gold
good grand grass great green ground group grow guess gun guy hair half hall hand happen
happy hard head health hear heart heat heavy hello help here high hill history hit hold
hole home honest hope horse hot hour house how huge human hundred hurry hurt idea
important improve in include increase indeed inside interest interesting into introduce
invent iron island jacket join joke journey judge jump just keep kind king kitchen
knock know lack land language large last late laugh law lead learn least leave left
leg lend length less lesson letter level library lie life light like listen little live
long look lord lose loss lot love low luck machine magazine mail main major make male
man manage many map march mark market marry match material matter maybe me mean
measure meat meet member memory mention message metal method middle might mile milk
mind mine minute mirror miss mistake mix model modern moment money month moon more
morning most mother mountain mouth move movie much music must my myself name nation
natural nature near nearly necessary neck need neighbor neither never new news next nice
night nine no nobody noise none nor north nose not note nothing notice now number
ocean of off offer office often oil old on once one only open order other our out
outside over own page pain paint pair paper parent part party pass past path pay peace
pencil people perfect perhaps person phone photo pick picture piece pig place plain
plan plant play please plenty pocket point police poor popular position possible post
pot potato power practice prepare present press pretty price print private probably
problem produce promise proper protect prove provide public pull push put quality quarter
question quick quiet quite radio rain raise range rate rather reach read ready real
reason receive recent record red reduce refuse regard region regular relate relationship
remain remember remove repeat reply report represent require rest result return rich
ride right ring rise river road rock roll roof room root rope rose round route row
rub rule run rush sad safe sail salt same sand save say school science sea search
season seat second secret see seem sell send sense sentence separate serious serve
service set settle seven several shape share sharp she sheep sheet shelf shine ship
shirt shoe shoot shop short should shoulder shout show shut sick side sign silence
silent silver similar simple since sing single sink sir sister sit six size skin sky
sleep slow small smart smell smile smoke snow so soap social soft soil soldier solve
some somebody someone something sometimes son song soon sorry sort sound soup south
space speak special speed spell spend spot spring square stamp stand star start state
station stay steam steel step stick still stone stop store storm story straight strange
street strong student study stuff subject success such sudden sugar suit summer sun
supper suppose sure surface surprise sweet swim table tail take talk tall taste tea
teach teacher team tear telephone tell ten tennis terrible test than thank that the
their them then there these they thick thin thing think third this those though
thought thousand three throat through throw thumb thus ticket tie tiger till time
tiny tired title to today together tomorrow tone tongue tonight too tool tooth top
total touch tough tour toward town toy trade train transport travel tree trouble truck
true trust truth try turn twelve twenty twice two type ugly uncle under understand
unfair unit unless until unusual upon upper upset use usual usually vegetable very
village visit voice vote wait walk wall want war warm warn wash waste watch water wave
way weak wear weather week weight welcome well west wet what wheel when where whether
which while white who whole whom whose why wide wife wild will win wind window wine
wing winter wipe wire wise wish with without woman wonder wonderful wood word work
world worry worth would write writer wrong yard year yellow yes yesterday yet you
young your yourself zero zoo
`;

const CORPUS = COMMON + `
ability able above accept account across action active add address adult advance affect
afford afraid afternoon again against age agency agent agree ahead air allow almost alone
along already amount animal announce another answer anxiety anyone anything apart apartment
appear apply approach area argue arm army around arrange arrive art article artist ask attack
attention attorney audience author available avoid away baby back bag balance ball bank bar base
beat beautiful beauty because become bed bedroom beer before begin behavior behind believe
benefit best better between beyond bicycle big bike bill bird birth bit bite blame blood blow
board boat body boil bone book boot border born bottle bottom bowl box boy brain branch bread
break breakfast breath breathe bridge brief bright bring broad brother brown brush budget build
building burn bus business busy but butter buy cabinet cable cake call camera camp campaign
cancer candidate cap capital car card care career careful carefully carry case cash cat catch
category cause cell center central century certain certainly chain chair challenge chance change
channel character charge chart chase cheap check cheek cheese chemical chest chicken chief child
children choice choose church circle circumstance citizen city civil claim class clear clearly
climb clock close clothes cloud coach coast coat code coffee cold collect college color column
combine come comfort comfortable command comment commercial common community company compare
computer concern condition conference congress consider consumer contain continue control cost
could country couple course court cover crack create crime cultural culture cup current customer
cut dance danger dark data daughter day dead deal dear death debate decade decide decision
deep degree deliver demand department depend describe design desk despite detail determine
develop development die difference different difficult dinner direction director discover discuss
disease do doctor document dog door double doubt down downtown dozen drop drug dry during dust
duty each ear early earn earth ease easily east easy eat economic economy edge education effect
effort eight either election electric else employee end energy enjoy enough enter entire
environment especially establish even evening event eventually ever every everybody everyone
everything everywhere evidence exactly example executive exist expect experience expert explain
eye face fact factor fail fall familiar family famous far farm fashion fast father fear feature
federal feed feel feeling field fight figure file fill film final finally financial find fine
finger finish fire firm first fish five floor flow flower fly focus follow food foot football for
force foreign forget form former forward four free friend from front full fund future game
garden gas general generation girl give glass global goal good government great green ground
group grow growth guess gun guy hair half hand hang happen happy hard have he head health hear
heart heat heavy help her here herself high him himself his history hit hold hole home hope
hospital hot hotel hour house how however huge human hundred hunt husband ice idea identify
image imagine impact important improve include including increase indeed indicate individual
industry information inside instead institution interest interesting international interview into
investment involve issue item itself job join just keep key kid kill kind kitchen know knowledge
land language large last late later laugh law lawyer lay lead leader learn least leave left leg
legal less let letter level lie life light like likely line list listen little live local long
look lose loss lot love low machine magazine main maintain major majority make man manage
management manager many market marriage material matter may maybe mean measure media medical
meet meeting member memory mention message method middle might military million mind minute miss
mission model modern moment money month more morning most mother mouth move movement movie much
music must myself name nation national natural nature near nearly necessary need network never
new news newspaper next nice night none nor north not note nothing notice now number occur
offer office officer official often oil old once one only onto open operation opportunity option
order organization other others our out outside over own owner page pain paint painting pair
paper parent part participant particular particularly partner party pass past patient pattern pay
peace people per perform performance perhaps period person personal phone physical pick picture
piece place plan plant play player point police policy political politics poor popular population
position positive possible power practice prepare present president press pressure pretty price
private probably problem process produce product production professional professor program
project property protect prove provide public pull purpose push quality question quickly quite
race radio raise range rate rather reach read ready real reality realize really reason receive
recent recently recognize record reduce reflect region relate relationship religious remain
remember remove report represent republican require research resource respond response
responsibility rest result return reveal rich right rise risk road rock role room rule run
safe same save say scene school science scientist score sea season seat second section security
seek seem sell send senior sense series serious serve service set seven several sex shake share
she shoot short shot should shoulder show side sign significant similar simple simply since sing
single sister sit site situation six size skill skin small smile social society soldier some
somebody someone something sometimes son song soon sort sound source south southern space speak
special specific speech spend sport spring staff stage stand standard star start state statement
station stay step still stock stop store story strategy street strong structure student study
stuff style subject success successful such suddenly suffer suggest summer support sure surface
system table take talk task tax teach teacher team technology television tell ten tend term test
than thank that their them themselves then theory there these they thing think third this those
though thought thousand threat three through throughout throw thus time today together tonight
too top total tough toward town trade traditional training travel treat treatment tree trial
trip trouble true truth try turn twice two type under understand unit until upon usually value
various very victim view violence visit voice vote wait walk wall want war watch water way we
weapon wear week weight well west western what whatever when where whether which while white who
whole whom whose why wide wife will win wind window wish with within without woman wonder word
work worker world worry would write writer wrong yard yeah year yes yet you young your yourself
` + `
abandon ability absence absorb abstract absurd abundant academy accent access accompany
accomplish accurate accuse achieve acknowledge acquire adapt adequate adjacent administer
admire adolescent advocate aesthetic affair affection affluent aftermath aggregate agitate
alleviate allocate allegiance ambiguous ambition ample amplify analogy anecdote animate
annihilate anomaly anticipate apparatus appease appetite arbitrary archaeology architecture
arduous articulate ascertain aspiration assault assert assimilate astonishing attribute augment
authentic authority autonomous avert ballistic bazaar bewildered bilateral blatant bountiful
brevity bureaucracy calamity candidate capacity capitalism carbon catalyst cathedral cautious
cease celebrate cellar censorship ceremony certificate chancellor charisma charter chronic
cinnamon circulate clarify coalition coherent coincide collaborate colossal commemorate
compassion compatible compelling compensate competent complement complicate compliment comprehend
comprise conceive condense confide confront congestion conjure consecutive consensus consequence
conservative consolidate conspicuous constitute constrain contaminate contemplate contemporary
contempt contend contingent contradict controversy convene converge conviction cordial correlate
corrupt cosmetic counterfeit counterpart courteous covenant credibility criterion critique cultivate
cumulative curriculum cynical deceive decentralize decisive dedicate deficient definitive
deliberate delusion demonstrate denomination deny depart depict deplete deploy deprive derivative
descend designate deteriorate determinant deviate devise diagnose dialect dictate differentiate
diffuse digest dilute diminish discrete discrepancy discrete displace disposition disproportionate
disseminate dissolve distinctive distort diversify doctrine dominate dormant drastic dubious
duplicate durable dwindle eccentric eclipse ecological edible elaborate elicit eloquent
eloquent elusive emanate embargo embed embody embrace emerge eminent empirical emulate enact
encapsulate encroach endemic endorse endow energetic enforce enlighten enrich ensue entail
enthusiasm entrench envision epidemic equilibrium equitable eradicate erode erratic escalate
espouse esteemed eternal evacuate evade evoke exacerbate excerpt exclusive exempt exhaust
exhort exotic expedite explicit exploit exponential extract extrapolate fabricate facilitate
fallacy fascinating feasible feign felicity ferocious fictitious fidelity finite flourish
formulate fossil foster fragment frivolous frugal fulfill fundamental fickle finite flippant
fortify foster fragile franchise fraudulent frugal fruitful fuse fusion galaxy gallant
garner genesis germane gracious gradient gratify gregarious grievance guile hackneyed
hallucinate harangue hardy haughty heresy hierarchy hindsight homogeneous hospitable humility
hybrid hygiene hypothetical idiosyncratic illuminate illusion imminent immunity impartial impede
imperial impetus implausible impromptu improvise impulsive inaugurate incentive incidence
inception incessant incidental inclination incoherent incompatible incongruous indispensable
indigenous indolent indispensable inevitable infallible infamous infer infinite inflict
infringe ingenious ingrained inimical innocuous innumerable insightful insignia instigate
integrity intelligible intensive intermittent intricate intrinsic introspective inundate
invariable invertebrate inveterate invoke irascible ironic irrigation itinerant
jeopardy judicious juxtapose kindle kinship laborious laconic lament languid latent lateral
latent legacy legislate legitimate lethargic leverage lexicon liaison liberate lineage linear
linguistic literal lucrative luminous magnify malfunction mandatory manifest manipulate
maritime mediate mediocre melancholy meticulous migrate militant mitigate modest momentum
monolithic monotonous monumental mundane mutate narrate nebulous negligible negotiate nominal
nonchalant nostalgia notable notify notorious nuance nurture oblique obsolescent obscure
obsolete omen onerous optimal optional orchestrate orientate ornate oscillate ostensible
ostracize painstaking paradox paramount parity parse partisan passive patronize penetrate
penury perennial peripheral perpetual perplex persecute pertinent pervasive pessimistic
petulant philanthropy pinnacle placid plausible poignant polarize ponder populace
porous pragmatic precedent precipice preclude precocious precursor predicament predominant
prevalent principled prodigal proficient profuse prolific propensity prosaic protagonist
provincial provisional provoke prudent punitive quandary quarantine quench quirk radiant
ramification rampant rancor rapport ratify rational reciprocal reckless reconcile rectify
recur redundant refute regenerate relegate relinquish remnant remorse renaissance renounce
repertoire replicate reproach repudiate reservoir residual resilient resonate respite
reticent retrospective revamp reverberate reverence rudimentary ruthless salient salvage
sanction sardonic saturate savory scaffold scrupulous secular sediment sedition segment
seismic semblance seminal sensibility sentinel serene serrated sever shirk significant simultaneous
singular sinister skeptic sluggish somber sophisticated sparse sparse sporadic stagnant
stark stifle stipulate stoic stolid stratify streamline stringent subdue subjective subjugate
sublime submerge subordinate subsequent subside subsidy substantial substantiate subtle succinct
sufficient sullen summit superficial superfluous supersede supplementary surmise susceptible
sycophant tacit tact tangible tantalize tardy tarnish taut tedious tepid terse threshold thrive
timid tirade toil tolerate torpid tractable transcend transient translucent traverse treacherous
truculent turbulent turbid ubiquitous unanimity uncanny undermine underscore undertaking
unify unravel unscrupulous untenable unwieldy usurp utilize vacillate validate vanquish variable
varnish vehement venerate veracity verbose verdant verify vernacular versatile vestige veto
viable vibrant vicinity vigilant vindicate visceral volatile voluminous voracious
wane warrant wary wayward whimsical wield winsome wizen wry zeal zealot zenith zest
` + `
running walked talked worked played looked asked needed wanted stayed turned
happened seemed left felt put brought began kept held wrote stood heard let meant
met ran paid sat spoke lay led grew lost fell sent built understood drew broke
spent cut rose driven bought caught taught fought found flew sang drank
abandoned ability absence absolute absorb abstract absurd abundant abuse academy
access accident accuse achieve acid acquire adapt adequate adjust admire admit adopt
advance advantage adventure advertise advice affair afford afraid agency aggressive
agriculture aid alarm album alcohol alert alien alive allowance alter alternative
ambition amount amuse analyse anchor ancient anger angle animal announce annoy
annual answer anticipate anxiety apartment apologize apparent appeal appearance
apply appoint appreciate approach approve argue arise arrange arrest arrive
artificial ashamed aspect assemble assess assign assist associate assume assure
attach attempt attend attitude attract audience author automatic available average
avoid awake award aware awful awkward
bachelor bacterial badly badge balance ban banana bankrupt banner bare bargain
barrier basement battery bean beard beat beg behave belief bell belong beneath benefit
betray bias bind biology bitter blade blanket blast blend bless blind block
blossom blush boast boil bolt bond boom boost booth border bore borrow bother
bounce bound bow bowl brace bracket braid brake branch brave breed breeze bribe
bride bridge brief bright brilliant brim brow brush bubble bucket bud budget
buffet bug bulb bulk bull bunch burden bureau burial burn burst bury
cabin cabinet cable cactus cafe cage calcium calculate calendar calm camera camp
campus canal canary cancel candle canvas canyon capable cape capacity capture
carbon career cargo carpet carriage cartoon carve cascade casual catalogue
category cater cathedral cautious cave cease ceiling celebrate cemetery census
centre ceramic cereal ceremony certify chalk challenge chamber champion channel
chaos chapter character charcoal charity charm chart charter chase chat cheat
check chemical cherish chief childhood chill chimney chin chip chocolate choice
choose chorus chronic chunk cider cinema circuit circumstance cite citizen civil
claim clarify clash classify clay client cliff climate climb clinic clip
clue cluster coal coarse coastal coax coconut code coexist coffee coil coin
collect colony column comb combine comedy comfort command comment commercial
commission commit committee commodity common communicate community companion company
compare compass compensate compete compile complain complete complex comply
compose compound comprehensive compromise compute conceal concede conceive concentrate
concept concern concert conclude concrete condemn condition conduct conference
confess confidence confirm conflict conform confront confuse congress connect
conquer conscience conscious consent consequence conserve consider consist constant
constitute construct consult consume contact contain contemporary content contest
context continent continue contract contrast contribute control convenient convention
conversation convert convey convince cook cooperate coordinate copper copy
coral core corn corporate correct correspond corrupt cottage cotton couch cough
council counsel count counter country county couple courage course court
courtesy cousin cover coward crack craft crane crash crate crawl crazy cream
create credit creek creep crew cricket crime crisis criteria critic crop
cross crowd crown crude cruel cruise crush cry crystal cube cultivate culture
cup cupboard cure curious curl currency curse curtain curve cushion custom
cycle daily dairy dam damage damp dance danger dare dark data dawn daylight
dead deal dear debate debt decade decay deceive decent decide deck declare decline
decorate decrease dedicate deed deep deer defeat defect defence delay delegate
delete deliberate delicate delight deliver demand democracy demonstrate denote deny
depart depend deposit depth derive descend describe desert deserve design desire
despair desperate despite destroy detail detect determine develop device devote
diagram dial diamond diary dictionary diet differ difficulty dig digital dignity
dilemma dimension dine dinner dip diploma direct dirt disability disagree disappear
disaster discipline disclose discount discover disease disgrace disguise disgust
dish disk dismiss disorder display dispute dissolve distance distinct distinguish
distribute district disturb dive diverse divide divorce dock doctor document dog
doll dollar domain dome domestic dominate donate donkey donor door dose dot
double doubt down dozen draft drag drain drama draw drawer dread dreadful
drift drill drink drip drive drop drought drown drum dry duck due dull dump
duplicate durable duration during dusk dust duty dwarf dwell dynamic eager
eagle earn earnest ease easel echo economy edge edit educate effect efficient
effort elaborate elastic elbow elder electronic elegant element elephant elevate
elite embrace emerge emergency emission emotion empire emphasis employ empty
enable enact enchant encircle enclose encounter encourage endure enemy energy
enforce engage engine enhance enjoy enlarge enlighten enormous enrol ensure
entertain enthusiasm entire entitle entrance entry envelope envy epidemic episode
equal equation equip equivalent era erase erect erode errand error escape escort
essay essence estate eternal ethics evacuate evaluate evaporate evening event
eventually evidence evil evoke evolve exact exaggerate examine exceed excel
exception excessive exchange excite exclude excuse execute exempt exert exhaust
exhibit exile exist exit exotic expand expect expense experiment expert expire
explain explicit explode exploit explore export expose extend extra extreme fabric
facade facilitate factor fade faint fair faith fake fame familiar famine fancy
fantastic fare farther fashion fasten fatal fate fatigue fault favour feasible
feast feather feature fee feeble fence fern fertile fever fibre fiction fierce
fifty filter finance finger finish finite fireplace firm fist flag flame flash
flat flavour flee flesh flexible flight float flock flood flour flow fluent
fluid flush focus fog foil fold folk fond forbid forecast foreign forest forge
formal former fortune forum fossil foster found foundation fountain fraction fragile
frame framework franchise fraud freeze freight frequent fresh friction fridge
friend fright fringe frog frontier frost frown frozen fuel fulfil function fund
fundamental funeral fuse fusion gain galaxy gallery gallon gallop gamble gap
garage garden garlic garment gasp gate gather gauge gaze gear gem general
generate generation genius gentle genuine geography gesture get ghost giant gift
giggle ginger glance glare glass gleam glide glimpse globe gloom glory glove
glow glue goal goat gold golf good govern grade gradual grain grand grant
grape grasp grass grateful grave gravel gravity graze grease greet grid grief
grill grim grin grind grip grocery groove gross ground group grove grow growl
guarantee guard guess guidance guilty guitar gulf habit hack hail hair half
hall hammer hamster hand handful handle hang happen happy harbour hard harsh
harvest haste hatch hate haul have hawk hazard haze head heal health heap
hear heart heat heaven heavy hedge heel height helium hell helmet help hen
herb herd heritage hero hesitate hidden hide high highlight highway hike hill
hint hip hire historic hobby hockey hold hole holiday hollow holy home honest
honey honour hook hope horizon horn horror hose host hostile hot hotel hound
house housing hover howl hug huge human humble humid humour hunt hurdle hurl
hurry hurt husband hut hydrogen hygiene ice icon idea ideal identify identity
idle ignore ill illegal illness illustrate image imagine imitate immense impact
imply import impose impress imprint improve impulse inch incident incline include
income increase indeed index indicate indoor industry infant infect infer
inflation influence inform ingredient inherit initial inject injure ink inland
inland inmate inn innocent inquiry insect insert inside insight insist inspect
inspire install instance instant instead instinct institute instruct instrument
insult insure intend intense intent interact interest interfere interior
internal interpret interrupt interval intervene interview intimate intricate
intrigue introduce invade invent invest invite involve iron ironic island isolate
issue item ivory jacket jade jail jam jar jaw jealous jelly jet jewel job
join joint joke jolly journal journey joy judge juggle juice jump junction
jungle junior jury just justice justify keen keep kettle key kick kidney
kill kilogram kind king kiss kit kitchen kite kitten knee kneel knife knock
knot know lab label labour lace lack ladder lady lake lamp land landscape
language lantern lap large laser last late laugh launch laundry law lawn
lawyer lay layer layout lazy lead leaf league lean leap learn lease least
leather leave lecture ledge leg legal legend leisure lemon lend length lens
less lesson let letter level lever liberty library licence lick lid lie life
lift light like limb lime limit line linen link lion lip liquid list listen
literature litter live load loaf loan lobby local locate lock lodge log logic
lonely long look loop loose lord lose loss lot loud lounge love low loyal
luck luggage lumber lunch lung luxury machine magic magnet mail main maintain
major make male mammal manage manager mandate manner mansion manual manufacture
manuscript map marble march margin marine mark market marriage marry mask mass
massive master match material math matter mature maximum may maybe mayor meadow
meal mean meaning meanwhile measure meat mechanic medal media medical medium meet
mellow melody melt member memory mention menu mercy mere merge merit merry mesh
message metal method metric middle midnight might mild mile military milk mill
million mind mineral minimum minor minute miracle mirror mischief miserable miss
missing mission mistake mix mixture mobile model modern modest modify moist moment
monitor monk monkey month monument mood moon moral morning mortgage most mother
motion motor mound mount mourn mouse mouth move movement movie mud muffin
mule multiply muscle museum mushroom music must mutual mystery myth nail naked
name narrative narrow nation native nature navigate navy near neat necessary neck
needle negative neglect neighbour nerve nest net network neutral never nevertheless
new news next nice niche nickel niece nightmare nitrogen noble nod noise nominate
none nonsense noon norm normal north nose note notice notion nourish novel
now nowhere nuclear number nurse nut oak oar obey object oblige observe obtain
obvious occupy occur ocean odd odour offend offer office official often oil
okay old olive omit onion online only onto onward opaque open opera opinion
oppose optical option orange orbit orchard order ordinary organ organize origin
original ornament orphan orthodox oscillate other ought ounce outcome outdoor
outer outline output outside oven overlap overlook overseas overwhelm owe own owner
oxygen pace pack package pad page pain paint pair palace pale palm pan panel
panic paper parade parcel parent park parliament parrot particle partner party pass
passage passenger passion passport past pasta patch path patience patrol pattern
pause pave paw payment peace peak peanut pear pearl peasant peculiar pedal peer
pen penalty pencil pendant people pepper perceive percent perfect perform perfume
perhaps period permanent permit persist person perspective persuade pet petrol
phase phenomenon philosophy phone photo phrase physical piano pick picture piece
pig pile pilot pine pink pioneer pipe pistol pity place plain plan plane planet
plant plastic plate platform play plaza plead pleasant please pleasure plenty plot
plug plum pocket poem poet point poison poke policy polish polite political politics
poll pollution pond pool popular population porch port portion portrait pose position
positive possess possible post pot potato potential pottery pouch poultry pound pour
poverty powder power practical practice praise pray precise predict prefer pregnant
prejudice premium prepare presence present preserve press pressure pretend pretty
prevent previous price pride priest primary prime prince principle print prior
prison private privilege prize probably problem procedure proceed process produce
product profession professional professor profile profit program progress prohibit
project promise promote prompt proof proper property proportion proposal propose
prospect protect protein protest proud prove provide province public publish pull
pulse pump punch pupil purchase pure purple purpose purse push put puzzle
qualify quality quantity quarter queen query question queue quick quiet quilt
quit quote rabbit race radar radiation radical radio radius rage raid rail rain
raise rally random range rank rapid rare rate rather rating ratio raw ray
reach react read reader ready real realistic realise reality realize rear reason
recall receive recent recipe recognise recognize recommend record recover recruit
recycle reduce refer reflect reform refuse regard regime region register regret
regular regulate rehearse reject relate relative relax release relevant reliable
relief religion rely remain remark remedy remind remote remove render renew rent
repair repeat replace reply report represent reproduce reptile republic reputation
request require rescue research resemble reserve resident resist resolve resource
respect respond rest restaurant restore restrict result retain retire retreat return
reveal revenue reverse review revise revive reward rhythm rice rich rid ride ridge
rifle right rigid ring riot ripe rise risk ritual rival river road robot rock
rocket rod role roll roof room root rope rose rotate rough round route routine
row royal rub rubber rubbish rude rug ruin rule run rural rush rust sacred sacrifice
saddle safe sail sailor sake salad salary sale salmon salt sample sanction sand
satellite satisfy sauce save say scale scan scandal scare scatter scenario scene
schedule scheme scholar school science scissors scold scoop scope score scorn
scrape scratch scream screen screw script scrub sculpture seal search season seat
second secret secretary section sector secure security see seed seek seem segment
seize seldom select self sell senate send senior sense sentence separate sequence
series serious servant serve service session settle seven severe sew shade shadow
shake shall shallow shame shape share sharp shatter shave shed sheep sheer sheet
shelf shell shelter shepherd sheriff shield shift shine ship shirt shiver shock shoe
shoot shop shore short should shoulder shout shove show shower shred shrink shrub
shuffle shut shy sick side siege sight sign signal significant silence silent silk
silly silver similar simple sin since sincere sing single sink sir sister sit site
situation six size skate sketch ski skill skin skirt skull sky slave sleep
sleeve slender slice slide slight slim slip slope slot slow small smart smear
smell smile smoke smooth snack snake snap sneak sniff snow soak soap so-called
social socket soft soil solar soldier sole solid solution solve some somebody somehow
someone something sometimes somewhat somewhere son song soon sophisticated sorry
sort soul sound soup sour source south space spare spark speak specialist species
specific spectrum speech speed spell spend sphere spice spider spike spill spin
spine spiral spirit spite splash split spoil sponsor spoon sport spot spray spread
spring sprinkle spy square squeeze stab stable stack staff stage stain stair
stake stamp stand standard staple star stare start startle starve state statement
statistics statue status steady steal steam steel steep steer stem step stereo
stick stiff still stimulate sting stir stock stomach stone stool stop storage
store storm story stove straight strain strain strand strange strap straw stream
street strength stress stretch strict strike string strip stripe stroke strong
structure struggle student studio study stuff stumble stun stupid style subject
submit subscribe substance substitute subtle suburb subway succeed success such
sudden sue suffer sufficient sugar suggest suit suitable sum summer summit sun
superb supply support suppose suppress supreme sure surface surge surgery surplus
surprise surrender surround survey survive suspect suspend swallow swear sweat sweep
sweet swell swift swim swing switch sword symbol sympathy symptom system table tail
take tale talent talk tall tank tape target task taste tax taxi tea teach team
tear technical technique technology teeth telegram telephone telescope television
tell temper temperature temple temporary tempt tenant tend tennis tension tent term
terrain terrible territory terror test testify testimony text texture than thank
theatre theft theme theory therapy there therefore thermal thick thief thin thing
think third thirst thorn though thought thread threat three threshold throat throne
through throw thumb thunder thus ticket tide tidy tie tight tile till timber time
tin tiny tip tired tissue title toast tobacco today toe together toilet token
tolerance tolerate toll tomb tone tongue tool tooth top topic torch total touch
tough tour tourist tow toward towel tower town toxic toy trace track trade
tradition traffic tragedy trail train trait transfer transit translate transmit
transport trap trash travel tray treasure treat treaty tree tremble trench trend
trial triangle tribe trick trigger trip triumph trolley troop trophy tropical
trouble trousers truck true trust truth try tube tunnel turn twelve twenty twice
twin twist two type typical tyre ugly ultimate umbrella uncle under undergo
underground underline understand undertake underwear undo unhappy uniform union unique
unit unite universe university unless unlike unlock until unusual upon upper
upset urban urge urgent usage use useful user usual utility vacant vacuum vague
valid valley valuable value van vanish vanity vapour variety various vary vast
vegetable vehicle veil vein velvet vendor venture venue verb verdict verge verify
verse version vertical very vessel veteran via vibrant vibrate vicar vice vicious
victim victory view vigorous village violate violent virtue virus visible vision
visit visual vital vivid vocal voice void volume voluntary vote voyage vulgar
vulnerable wage wagon waist wait waiter wake walk wall wallet wander want war
warehouse warm warn warrant wash waste watch water wave wax way weak wealth
weapon wear weary weather weave web wedding weed week weigh weight welcome welfare
well west wet whale what wheat wheel whereas whether which while whisper white
whole whom whose why wide widespread widow width wife wild will willing willow
win wind window wine wing winter wipe wire wisdom wise wish witness wolf woman
wonder wonderful wood wool word work worker world worm worry worth wound wrap
wrist write writer wrong yard year yellow yes yesterday yet yield you young
your youth zero zone
` + `
running walks walking talks talking worked working played playing looked looking
asked asking needed needing wanted wanting stayed staying turned turning
happened happening seemed seeming left felt felt put brought begun kept held
wrote stood heard let meant met ran paid sat spoke lay grew lost fell sent built
understood drew broke spent cut rose driven bought caught taught fought found flew
sang drank laid fallen frozen hidden spoken taken given seen known written
bigger bigger largest smallest higher lower older younger longer shorter faster
slower stronger weaker heavier lighter deeper taller wider
abandoned ability absence absolute absorb abstract absurd abundant abuse academy
access accident accuse achieve acid acquire adapt adequate adjust admire admit adopt
advance advantage adventure advertise advice affair afford afraid agency aggressive
agriculture aid alarm album alcohol alert alien alive allowance alter alternative
ambition amount amuse analyse anchor ancient anger angle animal announce annoy
annual answer anticipate anxiety apartment apologize apparent appeal appearance
apply appoint appreciate approach approve argue arise arrange arrest arrive
artificial ashamed aspect assemble assess assign assist associate assume assure
attach attempt attend attitude attract audience author automatic available average
avoid awake award aware awful awkward
`;

export const WORDS: string[] = CORPUS.trim().split(/\s+/).filter(Boolean);
