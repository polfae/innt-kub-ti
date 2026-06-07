# Stoyt / Tvørmegi – limainntøku roknari

Hetta er ein einfaldur responsivur roknari til mánaðarliga býtið av limainntøku millum Stoyt og Tvørmegi.

## Høvuðslogikkur

1. Skriva limagjøld og limatal inn fyri:
   - Vaksin
   - Ung
   - Kombi, har Stoyt-parturin er 270 kr sum standard
   - Partvís hald, sum kann broytast frá mánaði til mánað

2. Roknarin finnur samlaðu Stoyt-inntøkuna til býti:
   - limagjald × limatal fyri hvørt limahald
   - fyri Kombi verður bara Stoyt-parturin brúktur í sjálvari býti-útrokningini

3. Treytirnar kunnu broytast:
   - fyrstu limirnir til Tvørmegi
   - Stoyt % av eyka inntøku
   - hækking pr. eyka lim
   - maks. Stoyt %
   - samlaður Kombi prísur

4. Úrslitið vísir:
   - mánaðarligt býti hjá Stoyt
   - mánaðarliga flyting til Tvørmegi
   - árliga ábending, sum er mánaðarligt úrslit × 12

## Kombi-eykayvirlit

Kombi limahald er 650 kr sum standard. Roknarin brúkar 270 kr sum Stoyt-part í sjálvari býti-útrokningini.

Tvørmegi-parturin verður roknaður soleiðis:

```text
Tvørmegi Kombi-partur = samlaður Kombi prísur - Stoyt-partur
```

Við standard tølum:

```text
650 kr - 270 kr = 380 kr
```

Hetta kann vísast sum eitt eyka yvirlit á síðuni. Tað broytir ikki sjálva býti-útrokningina, men vísir Tvørmegi sína samlaðu inntøku, tá beinleiðis Kombi-parturin verður taldur við.

## Soleiðis koyrir tú síðuna

### Beinleiðis

Lat `index.html` upp í einum browsara.

### Visual Studio Code

1. Lat mappuna upp í Visual Studio Code.
2. Installera extensionina **Live Server**, um tú ikki longu hevur hana.
3. Høgraklikka á `index.html`.
4. Vel **Open with Live Server**.
5. Brúka lokalu adressuna á teldu, iPad ella telefon, um tey eru á sama neti.

## Fílur

- `index.html` – bygnaðurin á síðuni
- `styles.css` – design og responsivt layout
- `script.js` – útrokningar og interaktivitetur
