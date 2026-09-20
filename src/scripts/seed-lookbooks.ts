import { createServiceClient } from '../lib/db/client';

async function seedLookbooks() {
  const supabase = createServiceClient();

  const lookbooks = [
    {
      title: 'Serene Japandi Living Room',
      slug: 'serene-japandi-living-room',
      type: 'lookbook',
      status: 'published',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      room_type: 'living-room',
      style_tags: ['japandi', 'minimalist', 'scandinavian'],
      tags: ['interior', 'craftsmanship', 'living-room', 'japandi'],
      category: 'living-room',
      excerpt: 'A harmonious blend of Japanese wabi-sabi philosophy and Scandinavian utility, anchored by low-profile Malaysian Oak craftsmanship.',
      featured_image_url: '/lookbooks/japandi-living-room.jpg',
      featured_image_alt: 'Serene Japandi living room featuring minimalist oak TV cabinet and coffee table',
      seo_title: 'Serene Japandi Living Room Lookbook | Oak & Home',
      seo_description: 'Explore our Serene Japandi living room lookbook. Shop authentic Malaysian Oak low-slung entertainment units, side tables, and organic styling accents.',
      is_featured: true,
      read_time_minutes: 4,
      view_count: 142,
      template: 'lookbook',
      featured_products: [
        '1efda76a-ac2a-47ea-a8b8-301110d8bfa2', // BRINHILL 1.8M TV CABINET 802/1802
        '675ffcfb-7bc3-4cbe-b805-86a1edf6fc6f', // ALFORD SIDE TABLE 1802 (SOLID)
        '03214c85-36c0-4d46-ae55-95b148b38c78', // SIVAN 1.5M BENCH 822/1809
      ],
      hotspots: [
        {
          productId: '1efda76a-ac2a-47ea-a8b8-301110d8bfa2',
          x: 52,
          y: 72,
          label: 'Brinhill TV Cabinet',
          tooltip: 'Brinhill 1.8M TV Cabinet in Warm Oak finish',
        },
        {
          productId: '675ffcfb-7bc3-4cbe-b805-86a1edf6fc6f',
          x: 24,
          y: 68,
          label: 'Alford Side Table',
          tooltip: 'Alford Solid Oak Accent & Side Table',
        },
        {
          productId: '03214c85-36c0-4d46-ae55-95b148b38c78',
          x: 82,
          y: 78,
          label: 'Sivan 1.5M Bench',
          tooltip: 'Sivan 1.5M Multi-purpose Oak Bench',
        },
      ],
      body_mdx: `## Harmony in Restraint

In this curated Japandi living room, the core objective was creating an acoustic and visual sanctuary. Japandi design celebrates *shibui*—subtle, unobtrusive beauty—fused with the warmth and practicality of Scandinavian hygge.

### Grounding with Malaysian Oak

The centerpiece of this arrangement is the **Brinhill 1.8M TV Cabinet**, sitting gracefully low to the floor. By maintaining a low sightline, the ceiling feels noticeably loftier, inviting soft diffused light to wash across the room.

Pairing the clean horizontal profile of the console with the sculpted curves of the **Alford Side Table** introduces geometric rhythm without visual noise.

### Texture Palette & Styling Notes

- **Primary Timber**: Sustainable Malaysian Oak with natural grain preservation.
- **Fabrics**: Raw unbleached linen drapery and textured bouclé floor cushions.
- **Ceramics**: Unglazed matte earthenware vessels styled with dried seasonal botanicals.
- **Lighting**: Dimmable warm paper lantern pendants (2700K color temperature).

> *"A well-designed room shouldn't scream for your attention; it should welcome your breath and silence the day."*
`,
    },
    {
      title: 'Warm Oak Dining Sanctuary',
      slug: 'warm-oak-dining-sanctuary',
      type: 'lookbook',
      status: 'published',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
      room_type: 'dining-room',
      style_tags: ['scandinavian', 'modern', 'minimalist'],
      tags: ['dining', 'craftsmanship', 'interior'],
      category: 'dining-room',
      excerpt: 'Gather around timeless Malaysian Oak. Soft natural curves, tactile textures, and subtle joinery elevate everyday shared meals.',
      featured_image_url: '/lookbooks/warm-dining-sanctuary.jpg',
      featured_image_alt: 'Warm Scandinavian oak dining room with Breda dining table, bench, and credenza',
      seo_title: 'Warm Oak Dining Sanctuary Lookbook | Oak & Home',
      seo_description: 'Discover how to create a welcoming, durable Scandinavian dining space with our Breda Malaysian Oak dining table and sideboard.',
      is_featured: true,
      read_time_minutes: 3,
      view_count: 218,
      template: 'lookbook',
      featured_products: [
        '22a4810d-5e34-49f2-b4e3-d5869b0bc618', // BREDA 800X1350 DINING TABLE 109/167
        '03214c85-36c0-4d46-ae55-95b148b38c78', // SIVAN 1.5M BENCH 822/1809
        '8df59e2a-5956-43ef-97d9-49c87660b0c0', // BREDA 1.6M SIDEBOARD 109/167
      ],
      hotspots: [
        {
          productId: '22a4810d-5e34-49f2-b4e3-d5869b0bc618',
          x: 48,
          y: 62,
          label: 'Breda Dining Table',
          tooltip: 'Breda 800x1350 Solid Oak Dining Table',
        },
        {
          productId: '03214c85-36c0-4d46-ae55-95b148b38c78',
          x: 28,
          y: 74,
          label: 'Sivan Dining Bench',
          tooltip: 'Sivan 1.5M Solid Wood Dining Bench',
        },
        {
          productId: '8df59e2a-5956-43ef-97d9-49c87660b0c0',
          x: 82,
          y: 48,
          label: 'Breda Sideboard',
          tooltip: 'Breda 1.6M Sideboard for tableware storage',
        },
      ],
      body_mdx: `## The Hearth of the Modern Home

The dining room is no longer just a venue for meals; it is where conversations linger, work unfolds, and friends gather. This lookbook embraces an open, airy Scandinavian dining concept centered around durable solid timber.

### Flexible Seating & Spatial Flow

Instead of uniform high-backed chairs, we paired the **Breda Dining Table** with the **Sivan 1.5M Bench** on one side. This asymmetrical seating arrangement accomplishes two essential things:

1. **Uninterrupted Sightlines**: When entering the room, the bench tucks effortlessly below the tabletop, keeping sightlines clear.
2. **Flexible Hospitality**: Easily seat two adults or three children comfortably during festive gatherings.

### Storage with Soul

Against the perimeter wall, the **Breda 1.6M Sideboard** hides dining linens, flatware, and entertaining essentials, while providing an expansive surface for display—perfect for a sculptural vase or a turntable.
`,
    },
    {
      title: 'Minimalist Master Bedroom Retreat',
      slug: 'minimalist-master-bedroom-retreat',
      type: 'lookbook',
      status: 'published',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      room_type: 'bedroom',
      style_tags: ['minimalist', 'japandi', 'mid-century'],
      tags: ['bedroom', 'minimalist', 'rest'],
      category: 'bedroom',
      excerpt: 'Uncluttered tranquility. Warm timber undertones and gentle architectural lines invite restorative rest and calm mornings.',
      featured_image_url: '/lookbooks/minimalist-bedroom.jpg',
      featured_image_alt: 'Minimalist bedroom retreat styled with warm timber bedside tables and dresser',
      seo_title: 'Minimalist Master Bedroom Retreat | Oak & Home',
      seo_description: 'Design a tranquil bedroom sanctuary with solid Malaysian Oak bedside tables, generous dressers, and natural linen textures.',
      is_featured: false,
      read_time_minutes: 4,
      view_count: 95,
      template: 'lookbook',
      featured_products: [
        '0c81b8e1-226a-4870-bcfc-9275b9df7473', // BRINHILL BEDSIDE TABLE WITH 1 DRAWER 802/1802
        'd3bc5ca2-ddee-4774-81c1-4ed5aca0ad5c', // BRINHILL 1.55M DRESSER 802/1802
        '675ffcfb-7bc3-4cbe-b805-86a1edf6fc6f', // ALFORD SIDE TABLE 1802 (SOLID)
      ],
      hotspots: [
        {
          productId: '0c81b8e1-226a-4870-bcfc-9275b9df7473',
          x: 22,
          y: 65,
          label: 'Brinhill Bedside Table',
          tooltip: 'Brinhill 1-Drawer Bedside Table in Natural Oak',
        },
        {
          productId: 'd3bc5ca2-ddee-4774-81c1-4ed5aca0ad5c',
          x: 84,
          y: 56,
          label: 'Brinhill 1.55M Dresser',
          tooltip: 'Brinhill 1.55M 6-Drawer Dresser with soft-close glides',
        },
      ],
      body_mdx: `## Curating Calm for Restful Sleep

Visual clutter in the bedroom directly impacts sleep quality. By selecting intentional, multi-functional pieces, this master bedroom retreat maintains an atmosphere of absolute serenity.

### Thoughtful Nightstand Organization

The **Brinhill Bedside Table** provides a single soft-close drawer to conceal bedside clutter—charging cables, journals, and bedtime reading—leaving the top surface pristine for a warm reading light and a carafe of water.

### Organic Tone On Tone

- **Wall Finish**: Limewash plaster in soft oat/travertine hues.
- **Bedding**: Breathable French flax linen in ecru and washed moss.
- **Timber Grain**: Honey-toned Malaysian Oak finished with plant-based matte protective wax.
`,
    },
    {
      title: 'Nordic Creative Home Office',
      slug: 'nordic-creative-home-office',
      type: 'lookbook',
      status: 'published',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
      room_type: 'office',
      style_tags: ['scandinavian', 'modern', 'industrial'],
      tags: ['workspace', 'ergonomics', 'office'],
      category: 'office',
      excerpt: 'A focused workspace combining structured utility with organic oak warmth to keep you inspired throughout the workday.',
      featured_image_url: '/lookbooks/nordic-home-office.jpg',
      featured_image_alt: 'Nordic creative home office with solid wood counter desk and organized storage credenza',
      seo_title: 'Nordic Creative Home Office Lookbook | Oak & Home',
      seo_description: 'Boost focus and productivity with a Nordic inspired home workspace crafted from sustainable Malaysian Oak.',
      is_featured: false,
      read_time_minutes: 3,
      view_count: 87,
      template: 'lookbook',
      featured_products: [
        '8f85bc40-827d-46ea-b542-7728e42bd258', // ALFORD COUNTER TABLE 1802 (SOLID)
        '8df59e2a-5956-43ef-97d9-49c87660b0c0', // BREDA 1.6M SIDEBOARD 109/167
        '675ffcfb-7bc3-4cbe-b805-86a1edf6fc6f', // ALFORD SIDE TABLE 1802 (SOLID)
      ],
      hotspots: [
        {
          productId: '8f85bc40-827d-46ea-b542-7728e42bd258',
          x: 48,
          y: 62,
          label: 'Alford Counter Table',
          tooltip: 'Alford Solid Oak Counter / Work Desk',
        },
        {
          productId: '8df59e2a-5956-43ef-97d9-49c87660b0c0',
          x: 82,
          y: 50,
          label: 'Breda Storage Sideboard',
          tooltip: 'Breda 1.6M Sideboard for reference books and files',
        },
      ],
      body_mdx: `## Productivity Rooted in Nature

Studies show that natural wood in work environments reduces physiological stress responses and fosters creative endurance. This workspace eliminates the sterility of corporate offices in favor of warm, biophilic architecture.

### Elevated Work Height

Using the **Alford Counter Table**, the work surface sits at an ergonomic height that pairs with tall drafting chairs and supports active movement throughout the workday. The dense grain of solid Malaysian Oak provides rock-solid stability under heavy laptop stands and studio displays.

### Keep the Horizon Clean

Keep papers, supplies, and peripherals tucked within the **Breda Sideboard**, leaving your immediate field of vision completely clear and inspiring.
`,
    },
  ];

  console.log(`Seeding ${lookbooks.length} lookbooks...`);

  for (const item of lookbooks) {
    // Upsert by slug
    const { data: existing } = await supabase
      .from('content_pages')
      .select('id')
      .eq('slug', item.slug)
      .maybeSingle();

    if (existing) {
      console.log(`Updating existing lookbook: ${item.title} (${item.slug})`);
      const { error } = await supabase
        .from('content_pages')
        .update({
          ...item,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error(`Error updating ${item.slug}:`, error);
      } else {
        console.log(`Updated successfully: ${item.slug}`);
      }
    } else {
      console.log(`Inserting new lookbook: ${item.title} (${item.slug})`);
      const { error } = await supabase
        .from('content_pages')
        .insert({
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error(`Error inserting ${item.slug}:`, error);
      } else {
        console.log(`Inserted successfully: ${item.slug}`);
      }
    }
  }

  console.log('Seeding completed.');
}

seedLookbooks().catch(console.error);
