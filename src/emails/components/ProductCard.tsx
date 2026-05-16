import { Button, Section, Text } from 'react-email'

type ProductCardProps = {
  name:    string
  price:   string
  ctaUrl:  string
  ctaText: string
}

export function ProductCard({ name, price, ctaUrl, ctaText }: ProductCardProps) {
  return (
    <Section style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px 20px', margin: '4px 0 24px' }}>
      <Text style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: '600', color: '#111' }}>
        {name}
      </Text>
      <Text style={{ margin: '0 0 14px', fontSize: '14px', color: '#6b7280' }}>
        {price}
      </Text>
      <Button
        href={ctaUrl}
        style={{
          background:     '#111',
          color:          '#fff',
          padding:        '10px 20px',
          borderRadius:   '6px',
          fontSize:       '14px',
          fontWeight:     '600',
          textDecoration: 'none',
          display:        'inline-block',
        }}
      >
        {ctaText}
      </Button>
    </Section>
  )
}
