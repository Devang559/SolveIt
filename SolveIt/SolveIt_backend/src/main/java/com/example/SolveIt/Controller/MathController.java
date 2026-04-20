package com.example.SolveIt.Controller;

import com.example.SolveIt.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class MathController {

    @Autowired
    private OcrService ocrService;

    @PostMapping("/solve")
    public String solve(@RequestParam("file") MultipartFile file) {
        try {
            // Returns raw JSON string for the Canvas frontend
            return ocrService.processImageAndSolve(file);
        } catch (Exception e) {
            return "{\"error\": \"Internal Server Error\"}";
        }
    }

    @GetMapping
    public String Message(){
        return "Hello World!";
    }
}