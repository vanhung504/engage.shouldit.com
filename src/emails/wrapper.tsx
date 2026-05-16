import { Body, Container, Head, Html, Preview } from 'react-email'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { DynamicBody } from './components/DynamicBody'

type Props = {
  previewText:    string
  bodyHtml:       string
  unsubscribeUrl: string
}

export function EmailWrapper({ previewText, bodyHtml, unsubscribeUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <Header />
          <DynamicBody html={bodyHtml} />
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  )
}
