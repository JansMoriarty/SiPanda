<?php

namespace App\Services;

use Smalot\PdfParser\Parser as PdfParser;
use ZipArchive;
use DOMDocument;
use DOMXPath;

class DocumentExtractor
{
    public function extractPdf(string $path): string
    {
        $parser = new PdfParser();
        $pdf = $parser->parseFile($path);

        return $pdf->getText();
    }

    public function extractPptx(string $path): string
    {
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw new \RuntimeException('Tidak bisa membuka file PPTX');
        }

        // Tentukan urutan slide yang benar (sesuai urutan asli di PowerPoint)
        $slideOrder = $this->getSlideOrder($zip);

        $text = '';
        $slideNumber = 0;

        foreach ($slideOrder as $slideFile) {
            $slideNumber++;
            $slideXml = $zip->getFromName('ppt/slides/' . $slideFile);
            if ($slideXml === false) {
                continue;
            }

            $dom = new DOMDocument();
            $dom->loadXML($slideXml);
            $xpath = new DOMXPath($dom);
            $xpath->registerNamespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main');

            $textNodes = $xpath->query('//a:t');
            $slideText = [];
            foreach ($textNodes as $node) {
                $val = trim($node->nodeValue);
                if ($val !== '') {
                    $slideText[] = $val;
                }
            }

            $text .= "\n--- Slide {$slideNumber} ---\n" . implode("\n", $slideText) . "\n";
        }

        $zip->close();

        return $text;
    }

    private function getSlideOrder(ZipArchive $zip): array
    {
        $slideOrder = [];
        $relMap = [];

        $relsXml = $zip->getFromName('ppt/_rels/presentation.xml.rels');
        if ($relsXml !== false) {
            $relsDom = new DOMDocument();
            $relsDom->loadXML($relsXml);
            foreach ($relsDom->getElementsByTagName('Relationship') as $rel) {
                $relMap[$rel->getAttribute('Id')] = basename($rel->getAttribute('Target'));
            }
        }

        $presentationXml = $zip->getFromName('ppt/presentation.xml');
        if ($presentationXml !== false) {
            $presDom = new DOMDocument();
            $presDom->loadXML($presentationXml);
            foreach ($presDom->getElementsByTagName('sldId') as $sldId) {
                $rId = $sldId->getAttributeNS(
                    'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
                    'id'
                );
                if (isset($relMap[$rId])) {
                    $slideOrder[] = $relMap[$rId];
                }
            }
        }

        // Fallback kalau gagal baca urutan resmi
        if (empty($slideOrder)) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if (preg_match('#ppt/slides/slide(\d+)\.xml$#', $name)) {
                    $slideOrder[] = basename($name);
                }
            }
            natsort($slideOrder);
            $slideOrder = array_values($slideOrder);
        }

        return $slideOrder;
    }

    public function chunkText(string $text, int $wordsPerChunk = 500, int $overlapWords = 50): array
    {
        // Pisahkan per slide/section dulu kalau ada marker "--- Slide N ---"
        $sections = preg_split('/\n--- (Slide \d+|Halaman \d+) ---\n/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);

        $chunks = [];

        // Elemen ganjil adalah label (Slide N), elemen genap adalah isi teksnya
        for ($i = 1; $i < count($sections); $i += 2) {
            $label = $sections[$i];
            $content = trim($sections[$i + 1] ?? '');

            if ($content === '') {
                continue;
            }

            $words = preg_split('/\s+/', $content);
            $totalWords = count($words);
            $start = 0;

            while ($start < $totalWords) {
                $chunkWords = array_slice($words, $start, $wordsPerChunk);
                $chunks[] = [
                    'content' => implode(' ', $chunkWords),
                    'source_location' => $label,
                ];

                $start += ($wordsPerChunk - $overlapWords);
            }
        }

        // Fallback: kalau gak ada marker "Slide/Halaman" sama sekali (misal PDF tanpa marker)
        if (empty($chunks)) {
            $words = preg_split('/\s+/', trim($text));
            $totalWords = count($words);
            $start = 0;

            while ($start < $totalWords) {
                $chunkWords = array_slice($words, $start, $wordsPerChunk);
                $chunks[] = [
                    'content' => implode(' ', $chunkWords),
                    'source_location' => null,
                ];

                $start += ($wordsPerChunk - $overlapWords);
            }
        }

        return $chunks;
    }
}
